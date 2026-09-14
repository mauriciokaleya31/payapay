import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto, { randomBytes } from 'crypto';
import { createServer as createViteServer } from 'vite';
import { store, createAdminPasswordHash } from './server/store.js';
import { providerManager } from './server/providers/manager.js';
import { dispatchClientWebhook, testWebhookEndpoint } from './server/webhookNotifier.js';
import { Charge, PaymentLink, Product, ClientApp, PaymentMethodType, AuthSession, ProviderConfig, AdminUser } from './server/types.js';
import {
  verifyPassword,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  createSession,
  validateSessionToken,
} from './server/auth.js';

dotenv.config();

interface CustomRequest extends Request {
  rawBody?: string;
  clientApp?: ClientApp;
  adminSession?: AuthSession;
}

const app = express();
const PORT = 3000;

// Restore any persisted provider configs from database
try {
  const savedProviders = store.getProviders();
  if (savedProviders && savedProviders.length > 0) {
    for (const p of savedProviders) {
      if (providerManager.getConfig(p.id)) {
        providerManager.updateConfig(p.id, p);
      } else {
        providerManager.addOrUpdateCustomProvider(p);
      }
    }
  }
} catch {
  // Safe initialization
}

// Middleware to capture rawBody for HMAC verification while parsing JSON
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Security Middleware: Require Admin Authentication
// ----------------------------------------------------
function requireAdminAuth(req: CustomRequest, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Acesso restrito: autenticação de administrador obrigatória',
    });
  }

  const session = validateSessionToken(authHeader);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Sessão expirada ou token de acesso inválido. Por favor, inicie sessão novamente.',
    });
  }

  req.adminSession = session;
  next();
}

// ----------------------------------------------------
// Authentication helper for Client API routes
// ----------------------------------------------------
function authenticateClient(req: CustomRequest, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // If not provided, continue if it's an internal / pay-link request, or return 401
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const foundApp = store.getAppByApiKey(token);
  if (foundApp) {
    req.clientApp = foundApp;
  }
  next();
}

// ----------------------------------------------------
// Authentication Endpoints (Admin Login, Me, Logout)
// ----------------------------------------------------
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-mail e palavra-passe são obrigatórios.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check rate limit by email & IP
    const rateCheck = checkLoginRateLimit(`${cleanEmail}_${clientIp}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Demasiadas tentativas incorretas. Conta temporariamente bloqueada por segurança. Tente novamente em ${rateCheck.waitSeconds} segundos.`,
      });
    }

    const user = store.getUserByEmail(cleanEmail);
    if (!user || user.status !== 'active') {
      recordFailedLogin(`${cleanEmail}_${clientIp}`);
      store.addLog({
        type: 'system_error',
        title: 'Tentativa de Login Falhada (Utilizador inexistente)',
        details: `E-mail tentado: ${cleanEmail} | IP: ${clientIp}`,
        endpoint: '/api/v1/auth/login',
        statusCode: 401,
        success: false,
      });
      return res.status(401).json({
        success: false,
        error: 'Credenciais de acesso incorretas.',
      });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      recordFailedLogin(`${cleanEmail}_${clientIp}`);
      store.addLog({
        type: 'system_error',
        title: 'Tentativa de Login Falhada (Palavra-passe errada)',
        details: `E-mail: ${cleanEmail} | IP: ${clientIp}`,
        endpoint: '/api/v1/auth/login',
        statusCode: 401,
        success: false,
      });
      return res.status(401).json({
        success: false,
        error: 'Credenciais de acesso incorretas.',
      });
    }

    // Success: reset failed attempts
    resetLoginAttempts(`${cleanEmail}_${clientIp}`);

    // Update user login stats
    user.lastLoginAt = new Date().toISOString();
    user.lastLoginIp = clientIp;
    store.saveUser(user);

    // Create session
    const userAgent = req.headers['user-agent'];
    const session = createSession(user, clientIp, userAgent);

    store.addLog({
      type: 'api_request',
      title: `Login com Sucesso: ${user.email} (${user.role})`,
      details: `Sessão iniciada via IP ${clientIp}. Acesso concedido ao Painel Administrativo.`,
      endpoint: '/api/v1/auth/login',
      statusCode: 200,
      success: true,
    });

    res.json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const session = validateSessionToken(authHeader);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Sessão expirada ou inválida' });
    }

    const user = store.getUserById(session.userId);
    res.json({
      success: true,
      user: {
        id: session.userId,
        email: session.userEmail,
        name: session.userName,
        role: session.role,
        lastLoginAt: user?.lastLoginAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      store.deleteSession(cleanToken);
    }
    res.json({ success: true, message: 'Sessão terminada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Public Registration for Developers & Merchants
// ----------------------------------------------------
app.post('/api/v1/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, companyName } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, e-mail e palavra-passe são obrigatórios.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A palavra-passe deve ter pelo menos 6 caracteres.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = store.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Este endereço de e-mail já se encontra registado no sistema.',
      });
    }

    const { hash, salt } = createAdminPasswordHash(password);
    const userId = `usr_dev_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const cleanName = name.trim();

    const newUser: AdminUser = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      phone: phone ? phone.trim() : undefined,
      companyName: companyName ? companyName.trim() : `${cleanName} Soluções`,
      role: 'developer',
      passwordHash: hash,
      passwordSalt: salt,
      status: 'active',
      platformFeePercentage: 20, // 20% platform fee
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: clientIp,
    };

    store.saveUser(newUser);

    // Auto-generate primary developer app with API keys and webhook
    const appId = `app_dev_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const randHex = (n = 16) => randomBytes(n).toString('hex');
    const newApp: ClientApp = {
      id: appId,
      name: companyName ? `${companyName} App` : `Projeto Principal ${cleanName}`,
      description: 'Projeto primário para integração de pagamentos e checkout com a API Pay Yetux.',
      userId: newUser.id,
      userEmail: newUser.email,
      apiKeyLive: `nvx_live_${randHex(12)}`,
      secretKeyLive: `gw_sec_live_${randHex(16)}`,
      apiKeyTest: `py_test_${randHex(12)}`,
      secretKeyTest: `gw_sec_test_${randHex(16)}`,
      webhookUrl: '',
      webhookSecret: `whsec_${randHex(16)}`,
      webhookEvents: ['charge.paid', 'charge.failed', 'charge.pending'],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.saveApp(newApp);

    // Create session
    const userAgent = req.headers['user-agent'];
    const session = createSession(newUser, clientIp, userAgent);

    store.addLog({
      type: 'api_request',
      title: `Novo Desenvolvedor Registado: ${newUser.email}`,
      details: `Conta de desenvolvedor criada com sucesso. Projeto e chaves de API iniciais geradas.`,
      endpoint: '/api/v1/auth/register',
      statusCode: 201,
      success: true,
    });

    res.status(201).json({
      success: true,
      token: session.token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        companyName: newUser.companyName,
        role: newUser.role,
        platformFeePercentage: newUser.platformFeePercentage,
        lastLoginAt: newUser.lastLoginAt,
      },
      app: newApp,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Profile Management (Get & Update Profile)
// ----------------------------------------------------
app.get('/api/v1/auth/profile', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const userId = req.adminSession?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }
    const user = store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }

    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/auth/profile', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const userId = req.adminSession?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const user = store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado' });
    }

    const { name, phone, companyName, avatarUrl, email, currentPassword, newPassword } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    // Change email if unique
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = store.getUserByEmail(cleanEmail);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ success: false, error: 'Este e-mail já está em utilização por outra conta.' });
      }
      user.email = cleanEmail;
      if (req.adminSession) {
        req.adminSession.userEmail = cleanEmail;
      }
    }

    // Change password if requested
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      }
      if (currentPassword) {
        const isValid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
        if (!isValid) {
          return res.status(400).json({ success: false, error: 'A palavra-passe atual indicada está incorreta.' });
        }
      }
      const { hash, salt } = createAdminPasswordHash(newPassword);
      user.passwordHash = hash;
      user.passwordSalt = salt;
    }

    store.saveUser(user);

    store.addLog({
      type: 'api_request',
      title: `Perfil Atualizado: ${user.email}`,
      details: `Dados de perfil e credenciais do utilizador ${user.name} atualizados com sucesso.`,
      endpoint: '/api/v1/auth/profile',
      statusCode: 200,
      success: true,
    });

    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, message: 'Perfil atualizado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Admin: User Management (List, Create, Update, Delete)
// ----------------------------------------------------
app.get('/api/v1/users', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isSuperAdmin = req.adminSession?.role === 'super_admin' || req.adminSession?.role === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Acesso negado: permissão restrita a administradores.' });
    }

    const usersWithStats = store.getUsersWithStats();
    res.json({ success: true, users: usersWithStats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/users', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isSuperAdmin = req.adminSession?.role === 'super_admin' || req.adminSession?.role === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Acesso negado: permissão restrita a administradores.' });
    }

    const { name, email, password, role, phone, companyName, platformFeePercentage } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nome, e-mail e palavra-passe são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = store.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Este e-mail já se encontra registado.' });
    }

    const { hash, salt } = createAdminPasswordHash(password);
    const userId = `usr_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const userRole = role === 'admin' || role === 'super_admin' ? role : 'developer';

    const newUser: AdminUser = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      companyName: companyName ? companyName.trim() : undefined,
      role: userRole,
      passwordHash: hash,
      passwordSalt: salt,
      status: 'active',
      platformFeePercentage: platformFeePercentage !== undefined ? Number(platformFeePercentage) : 20,
      createdAt: new Date().toISOString(),
    };

    store.saveUser(newUser);

    // If role is developer, auto-create a default app for them
    if (userRole === 'developer') {
      const randHex = (n = 16) => randomBytes(n).toString('hex');
      const newApp: ClientApp = {
        id: `app_${Date.now()}_${randHex(4)}`,
        name: companyName ? `${companyName} App` : `Projeto Principal ${newUser.name}`,
        description: 'Projeto para integração da API Pay Yetux (Multicaixa Express & GPR).',
        userId: newUser.id,
        userEmail: newUser.email,
        apiKeyLive: `nvx_live_${randHex(12)}`,
        secretKeyLive: `gw_sec_live_${randHex(16)}`,
        apiKeyTest: `py_test_${randHex(12)}`,
        secretKeyTest: `gw_sec_test_${randHex(16)}`,
        webhookUrl: '',
        webhookSecret: `whsec_${randHex(16)}`,
        webhookEvents: ['charge.paid', 'charge.failed', 'charge.pending'],
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      store.saveApp(newApp);
    }

    const { passwordHash, passwordSalt, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser, message: 'Utilizador criado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/users/:id', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isSuperAdmin = req.adminSession?.role === 'super_admin' || req.adminSession?.role === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Acesso negado: permissão restrita a administradores.' });
    }

    const user = store.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado.' });
    }

    const { name, phone, companyName, role, status, platformFeePercentage, newPassword } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (role && user.role !== 'super_admin') user.role = role;
    if (status && user.role !== 'super_admin') user.status = status;
    if (platformFeePercentage !== undefined) user.platformFeePercentage = Number(platformFeePercentage);

    if (newPassword && newPassword.length >= 6) {
      const { hash, salt } = createAdminPasswordHash(newPassword);
      user.passwordHash = hash;
      user.passwordSalt = salt;
    }

    store.saveUser(user);
    const { passwordHash, passwordSalt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, message: 'Utilizador atualizado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/users/:id', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isSuperAdmin = req.adminSession?.role === 'super_admin' || req.adminSession?.role === 'admin';
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, error: 'Acesso negado: permissão restrita a administradores.' });
    }

    const targetUser = store.getUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Utilizador não encontrado.' });
    }

    if (targetUser.role === 'super_admin' || targetUser.id === req.adminSession?.userId) {
      return res.status(400).json({ success: false, error: 'Não é permitido eliminar o Super Administrador ou a sua própria conta ativa.' });
    }

    const deleted = store.deleteUser(req.params.id);
    res.json({ success: deleted, message: 'Utilizador removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Gateway de Pagamentos Multi-Provedor',
    version: '1.0.0',
    primaryProvider: 'Nuvex Pagamentos (GPO / GPR)',
  });
});

// ----------------------------------------------------
// Dashboard Stats (Protected)
// ----------------------------------------------------
app.get('/api/v1/stats', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isDev = req.adminSession?.role === 'developer';
    const stats = isDev ? store.getStats(req.adminSession?.userId) : store.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Charges / Transactions
// ----------------------------------------------------
// List charges with optional filters (Protected)
app.get('/api/v1/charges', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isDev = req.adminSession?.role === 'developer';
    let list = isDev ? store.getCharges(req.adminSession?.userId) : store.getCharges();
    const { status, method, appId, search } = req.query;

    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status);
    }
    if (method && method !== 'all') {
      list = list.filter((c) => c.method === method);
    }
    if (appId && appId !== 'all') {
      list = list.filter((c) => c.appId === appId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.merchantTransactionId.toLowerCase().includes(q) ||
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
          (c.phoneNumber && c.phoneNumber.includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: list.length, charges: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get charge by ID or merchant transaction ID
app.get('/api/v1/charges/:id', async (req, res) => {
  try {
    const charge = store.getChargeById(req.params.id);
    if (!charge) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada' });
    }
    res.json({ success: true, charge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new charge (Core Gateway API: works for Client Apps and Hosted Checkout)
app.post('/api/v1/charges', authenticateClient, async (req: CustomRequest, res: Response) => {
  try {
    const {
      amount,
      method,
      phone_number,
      phoneNumber,
      merchant_transaction_id,
      merchantTransactionId,
      description,
      customer_name,
      customerName,
      customer_email,
      customerEmail,
      payment_link_id,
      paymentLinkId,
      product_id,
      productId,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montante inválido (amount deve ser maior que 0)',
      });
    }

    const payMethod: PaymentMethodType = method === 'GPR' ? 'GPR' : 'GPO';
    const phone = (phone_number || phoneNumber || '').trim();

    if (payMethod === 'GPO' && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Número de telemóvel é obrigatório para pagamentos via Multicaixa Express (GPO)',
      });
    }

    const txId =
      merchant_transaction_id ||
      merchantTransactionId ||
      `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const appInfo = req.clientApp || (paymentLinkId ? store.getApps()[0] : undefined);

    // Resolve provider for the requested method (Nuvex by default)
    const { provider, config } = providerManager.resolveProviderForMethod(payMethod);

    // Invoke provider implementation
    const providerResult = await provider.createCharge(
      {
        amount: numAmount,
        method: payMethod,
        phoneNumber: phone,
        merchantTransactionId: txId,
        description: description || 'Pagamento Gateway',
        customerName: customer_name || customerName,
        customerEmail: customer_email || customerEmail,
      },
      config
    );

    const platformFeeRate = 0.20; // 20% platform fee Pay Yetux
    const platformFee = Math.round(numAmount * platformFeeRate);
    const netAmount = numAmount - platformFee;

    const newCharge: Charge = {
      id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantTransactionId: txId,
      appId: appInfo?.id,
      appName: appInfo?.name || 'Gateway Checkout',
      userId: appInfo?.userId || req.adminSession?.userId,
      userEmail: appInfo?.userEmail || req.adminSession?.userEmail,
      providerId: provider.id,
      providerChargeId: providerResult.providerChargeId,
      amount: numAmount,
      currency: 'AOA',
      method: payMethod,
      phoneNumber: phone || undefined,
      description: description || 'Pagamento via Gateway',
      customerName: customer_name || customerName,
      customerEmail: customer_email || customerEmail,
      status: providerResult.status,
      paymentLinkId: payment_link_id || paymentLinkId,
      productId: product_id || productId,
      referenceDetails: providerResult.referenceDetails,
      environment: appInfo?.apiKeyTest?.includes(req.headers['authorization'] || '') ? 'test' : 'live',
      platformFeeRate,
      platformFee,
      netAmount,
      createdAt: new Date().toISOString(),
      providerRawResponse: providerResult.rawResponse,
    };

    store.saveCharge(newCharge);

    // If charge linked to a payment link, update link stats
    if (newCharge.paymentLinkId) {
      const link = store.getLinkById(newCharge.paymentLinkId);
      if (link) {
        link.totalViews += 1;
        store.saveLink(link);
      }
    }

    store.addLog({
      type: 'api_request',
      title: `Cobrança Criada: ${newCharge.amount} Kz (${newCharge.method})`,
      details: `Provedor: ${provider.name} | MerchantTx: ${newCharge.merchantTransactionId}`,
      endpoint: '/api/v1/charges',
      statusCode: 201,
      success: true,
      chargeId: newCharge.id,
      appId: newCharge.appId,
      payload: { amount: newCharge.amount, method: newCharge.method },
    });

    res.status(201).json({
      success: true,
      charge: newCharge,
      message:
        payMethod === 'GPO'
          ? 'Notificação Multicaixa Express emitida para o telemóvel do cliente'
          : 'Referência de pagamento bancária gerada com sucesso',
    });
  } catch (err: any) {
    store.addLog({
      type: 'system_error',
      title: 'Erro na criação de cobrança',
      details: err.message,
      endpoint: '/api/v1/charges',
      statusCode: 500,
      success: false,
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

// Force sync / fallback query from provider (Protected)
app.post('/api/v1/charges/:id/sync', requireAdminAuth, async (req, res) => {
  try {
    const charge = store.getChargeById(req.params.id);
    if (!charge) {
      return res.status(404).json({ success: false, error: 'Cobrança não encontrada' });
    }

    const provider = providerManager.getProvider(charge.providerId);
    const config = providerManager.getConfig(charge.providerId);

    if (provider) {
      const queryId = charge.providerChargeId || charge.merchantTransactionId;
      const statusResult = await provider.checkStatus(queryId, config);

      if (statusResult.status !== charge.status) {
        charge.status = statusResult.status;
        if (statusResult.status === 'paid' && !charge.paidAt) {
          charge.paidAt = statusResult.paidAt || new Date().toISOString();
        }
        store.saveCharge(charge);

        // Notify client application if registered
        if (charge.appId) {
          const app = store.getAppById(charge.appId);
          if (app) {
            dispatchClientWebhook(charge, app, `charge.${charge.status}` as any);
          }
        }
      }
    }

    res.json({ success: true, charge });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate payment approval (useful for testing Multicaixa Express push confirmation in the checkout)
app.post('/api/v1/charges/:id/simulate-pay', async (req, res) => {
  try {
    const charge = store.getChargeById(req.params.id);
    if (!charge) {
      return res.status(404).json({ success: false, error: 'Cobrança não encontrada' });
    }

    charge.status = 'paid';
    charge.paidAt = new Date().toISOString();
    store.saveCharge(charge);

    // Update payment link & product sales if linked
    if (charge.paymentLinkId) {
      const link = store.getLinkById(charge.paymentLinkId);
      if (link) {
        link.totalSalesCount += 1;
        link.totalSalesAmount += charge.amount;
        store.saveLink(link);
      }
    }

    if (charge.productId) {
      const prod = store.getProductById(charge.productId);
      if (prod) {
        prod.salesCount += 1;
        if (prod.stock && prod.stock > 0) prod.stock -= 1;
        store.saveProduct(prod);
      }
    }

    // Dispatch webhook to client app
    if (charge.appId) {
      const clientApp = store.getAppById(charge.appId);
      if (clientApp) {
        dispatchClientWebhook(charge, clientApp, 'charge.paid');
      }
    }

    store.addLog({
      type: 'webhook_received',
      title: `Pagamento Aprovado: ${charge.amount} Kz (${charge.method})`,
      details: `Transação ${charge.merchantTransactionId} marcada como paga.`,
      endpoint: `/api/v1/charges/${charge.id}/simulate-pay`,
      statusCode: 200,
      success: true,
      chargeId: charge.id,
      appId: charge.appId,
    });

    res.json({
      success: true,
      message: 'Pagamento confirmado e processado com sucesso.',
      charge,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Inbound Nuvex Webhook Callback
// ----------------------------------------------------
/**
 * Header recebido:
 * x-nuvex-signature: t=<timestamp>,v1=<hmac_sha256_hex>
 * Valida o HMAC-SHA256 de `${t}.${rawBody}` com o NUVEX_WEBHOOK_SECRET, em tempo constante.
 * Rejeita com 401 se falhar.
 * Marca como pago quando status = "paid" (handler idempotente) e responde 200.
 */
app.post('/api/v1/webhooks/nuvex', async (req: CustomRequest, res: Response) => {
  const signatureHeader = req.headers['x-nuvex-signature'] as string | undefined;
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const nuvexConfig = providerManager.getConfig('nuvex');
  const webhookSecret = nuvexConfig?.webhookSecret || process.env.NUVEX_WEBHOOK_SECRET || 'whsec_demo_webhook_signature';

  const nuvexProvider = providerManager.getProvider('nuvex');

  // Verify HMAC signature in constant time
  const isValid = nuvexProvider?.verifyWebhookSignature(signatureHeader, rawBody, webhookSecret);

  if (!isValid && process.env.NODE_ENV === 'production') {
    store.addLog({
      type: 'webhook_received',
      title: 'Callback Nuvex Rejeitado: Assinatura Inválida',
      details: `Assinatura x-nuvex-signature não confere com NUVEX_WEBHOOK_SECRET`,
      endpoint: '/api/v1/webhooks/nuvex',
      statusCode: 401,
      success: false,
    });
    return res.status(401).json({ error: 'Assinatura HMAC inválida' });
  }

  const payload = req.body;
  const chargeIdentifier = payload.id || payload.charge_id || payload.merchant_transaction_id;
  const status = payload.status; // "paid", "failed", etc.

  const existingCharge = chargeIdentifier ? store.getChargeById(chargeIdentifier) : undefined;

  store.addLog({
    type: 'webhook_received',
    title: `Callback Nuvex: status="${status}" (${payload.method || 'GPO/GPR'})`,
    details: `Transação: ${chargeIdentifier} | Assinatura HMAC: ${isValid ? 'Válida' : 'Bypass modo dev'}`,
    endpoint: '/api/v1/webhooks/nuvex',
    statusCode: 200,
    success: true,
    chargeId: existingCharge?.id,
    payload,
  });

  // Idempotent update
  if (existingCharge) {
    if (status === 'paid' && existingCharge.status !== 'paid') {
      existingCharge.status = 'paid';
      existingCharge.paidAt = payload.paid_at || new Date().toISOString();
      store.saveCharge(existingCharge);

      // Forward webhook event to client application
      if (existingCharge.appId) {
        const clientApp = store.getAppById(existingCharge.appId);
        if (clientApp) {
          dispatchClientWebhook(existingCharge, clientApp, 'charge.paid');
        }
      }
    } else if (status === 'failed' && existingCharge.status !== 'failed') {
      existingCharge.status = 'failed';
      existingCharge.failedAt = new Date().toISOString();
      store.saveCharge(existingCharge);

      if (existingCharge.appId) {
        const clientApp = store.getAppById(existingCharge.appId);
        if (clientApp) {
          dispatchClientWebhook(existingCharge, clientApp, 'charge.failed');
        }
      }
    }
  }

  // Nuvex specifies returning 200 OK
  return res.status(200).json({ received: true });
});

// ----------------------------------------------------
// Payment Links
// ----------------------------------------------------
app.get('/api/v1/links', (_req, res) => {
  try {
    const links = store.getLinks();
    res.json({ success: true, links });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/links/:idOrSlug', (req, res) => {
  try {
    const link = store.getLinkById(req.params.idOrSlug);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link de pagamento não encontrado' });
    }
    res.json({ success: true, link });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/links', requireAdminAuth, (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      imageUrl,
      allowedMethods,
      requiresCustomerName,
      requiresCustomerEmail,
      requiresCustomerPhone,
      productId,
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ success: false, error: 'Título e preço são obrigatórios' });
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const newLink: PaymentLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slug,
      appId: req.body.appId || store.getApps()[0]?.id,
      title,
      description: description || '',
      amount: Number(amount),
      currency: 'AOA',
      imageUrl: imageUrl || '',
      allowedMethods: allowedMethods && allowedMethods.length > 0 ? allowedMethods : ['GPO', 'GPR'],
      isActive: true,
      requiresCustomerName: requiresCustomerName ?? true,
      requiresCustomerEmail: requiresCustomerEmail ?? true,
      requiresCustomerPhone: requiresCustomerPhone ?? true,
      totalViews: 0,
      totalSalesCount: 0,
      totalSalesAmount: 0,
      createdAt: new Date().toISOString(),
      productId,
    };

    store.saveLink(newLink);

    // If tied to product, update product
    if (productId) {
      const prod = store.getProductById(productId);
      if (prod) {
        prod.paymentLinkId = newLink.id;
        store.saveProduct(prod);
      }
    }

    res.status(201).json({ success: true, link: newLink });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/links/:id', requireAdminAuth, (req, res) => {
  try {
    const deleted = store.deleteLink(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Mini Loja / Products
// ----------------------------------------------------
app.get('/api/v1/products', (_req, res) => {
  try {
    const products = store.getProducts();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/products', requireAdminAuth, (req, res) => {
  try {
    const { name, description, price, imageUrl, category, stock, createLink } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, error: 'Nome e preço são obrigatórios' });
    }

    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      appId: store.getApps()[0]?.id,
      name,
      description: description || '',
      price: Number(price),
      currency: 'AOA',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      category: category || 'Geral',
      stock: stock ? Number(stock) : undefined,
      isActive: true,
      salesCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (createLink) {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 6);

      const link: PaymentLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        slug,
        appId: newProd.appId,
        title: newProd.name,
        description: newProd.description,
        amount: newProd.price,
        currency: 'AOA',
        imageUrl: newProd.imageUrl,
        allowedMethods: ['GPO', 'GPR'],
        isActive: true,
        requiresCustomerName: true,
        requiresCustomerEmail: true,
        requiresCustomerPhone: true,
        totalViews: 0,
        totalSalesCount: 0,
        totalSalesAmount: 0,
        createdAt: new Date().toISOString(),
        productId: newProd.id,
      };
      store.saveLink(link);
      newProd.paymentLinkId = link.id;
    }

    store.saveProduct(newProd);
    res.status(201).json({ success: true, product: newProd });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/products/:id', requireAdminAuth, (req, res) => {
  try {
    const prod = store.getProductById(req.params.id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    const updated = store.saveProduct({ ...prod, ...req.body });
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/products/:id', requireAdminAuth, (req, res) => {
  try {
    const deleted = store.deleteProduct(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Client Applications & API Keys Management
// ----------------------------------------------------
app.get('/api/v1/apps', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const isDev = req.adminSession?.role === 'developer';
    const apps = isDev ? store.getApps(req.adminSession?.userId) : store.getApps();
    res.json({ success: true, apps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/apps', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const { name, description, userEmail, webhookUrl, webhookEvents } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome da aplicação é obrigatório' });
    }

    const randHex = (n = 16) => randomBytes(Math.ceil(n / 2)).toString('hex').substring(0, n);

    const newApp: ClientApp = {
      id: `app_${Date.now()}_${randHex(6)}`,
      name,
      description: description || '',
      userId: req.adminSession?.userId || `usr_${randHex(6)}`,
      userEmail: req.adminSession?.userEmail || userEmail || 'dev@payyetux.ao',
      apiKeyLive: `nvx_live_${randHex(18)}`,
      secretKeyLive: `gw_sec_live_${randHex(20)}`,
      apiKeyTest: `py_test_${randHex(18)}`,
      secretKeyTest: `gw_sec_test_${randHex(20)}`,
      webhookUrl: webhookUrl || '',
      webhookSecret: `whsec_${randHex(20)}`,
      webhookEvents: webhookEvents || ['charge.paid', 'charge.failed', 'charge.pending'],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    store.saveApp(newApp);
    res.status(201).json({ success: true, app: newApp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/apps/:id', requireAdminAuth, (req, res) => {
  try {
    const appItem = store.getAppById(req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, error: 'Aplicação não encontrada' });
    }
    const updated = store.saveApp({ ...appItem, ...req.body });
    res.json({ success: true, app: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/apps/:id', requireAdminAuth, (req, res) => {
  try {
    const deleted = store.deleteApp(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/apps/:id/rotate-keys', requireAdminAuth, (req, res) => {
  try {
    const appItem = store.getAppById(req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }
    const { keyType } = req.body; // 'live' | 'test' | 'all'
    const randHex = (n = 18) => Math.random().toString(36).substring(2, 2 + n);

    if (keyType === 'live' || keyType === 'all' || !keyType) {
      appItem.apiKeyLive = `nvx_live_${randHex(18)}`;
      appItem.secretKeyLive = `gw_sec_live_${randHex(20)}`;
    }
    if (keyType === 'test' || keyType === 'all' || !keyType) {
      appItem.apiKeyTest = `py_test_${randHex(18)}`;
      appItem.secretKeyTest = `gw_sec_test_${randHex(20)}`;
    }

    const updated = store.saveApp(appItem);
    store.addLog({
      type: 'api_request',
      title: `Chaves de API Regeneradas para o Projeto ${appItem.name}`,
      details: `Tipo de chave: ${keyType || 'all'}`,
      endpoint: `/api/v1/apps/${req.params.id}/rotate-keys`,
      statusCode: 200,
      success: true,
      appId: appItem.id,
    });
    res.json({ success: true, app: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Admin: Providers & Multi-Provider Engine
// ----------------------------------------------------
app.get('/api/v1/providers', requireAdminAuth, (_req, res) => {
  try {
    const configs = providerManager.getAllConfigs();
    res.json({ success: true, providers: configs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/providers', requireAdminAuth, (req, res) => {
  try {
    const { id, name, description, apiUrl, apiKey, secretKey, webhookSecret, supportedMethods, testMode, isActive } = req.body;
    if (!name || !apiUrl) {
      return res.status(400).json({ success: false, error: 'Nome e URL do Gateway são obrigatórios.' });
    }

    const providerId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newConfig: ProviderConfig = {
      id: providerId,
      name,
      description: description || 'Gateway de Pagamentos adicional',
      isActive: isActive !== false,
      isDefault: false,
      apiUrl,
      apiKey: apiKey || '',
      secretKey: secretKey || '',
      webhookSecret: webhookSecret || '',
      supportedMethods: supportedMethods || ['GPO', 'GPR'],
      testMode: testMode || false,
    };

    providerManager.addOrUpdateCustomProvider(newConfig);
    store.saveProvider(newConfig);
    store.addLog({
      type: 'provider_config',
      title: `Novo Gateway Cadastrado: ${newConfig.name}`,
      details: `Endpoint: ${newConfig.apiUrl} | Métodos: ${newConfig.supportedMethods.join(', ')}`,
      endpoint: '/api/v1/providers',
      statusCode: 201,
      success: true,
    });

    res.status(201).json({ success: true, provider: newConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/providers/:id', requireAdminAuth, (req, res) => {
  try {
    const providerId = req.params.id;
    if (providerId === 'nuvex') {
      return res.status(400).json({ success: false, error: 'O gateway Nuvex é o conector base e não pode ser excluído.' });
    }
    providerManager.deleteProvider(providerId);
    store.deleteProvider(providerId);
    store.addLog({
      type: 'provider_config',
      title: `Gateway Removido: ${providerId}`,
      details: 'Gateway desinstalado pelo administrador.',
      endpoint: `/api/v1/providers/${providerId}`,
      statusCode: 200,
      success: true,
    });
    res.json({ success: true, message: 'Gateway removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/providers/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = providerManager.updateConfig(req.params.id, req.body);
    store.saveProvider(updated);
    store.addLog({
      type: 'provider_config',
      title: `Configuração atualizada para o provedor ${updated.name}`,
      details: `Status ativo: ${updated.isActive} | Modo teste: ${updated.testMode} | Métodos: ${updated.supportedMethods.join(', ')}`,
      endpoint: `/api/v1/providers/${req.params.id}`,
      statusCode: 200,
      success: true,
    });
    res.json({ success: true, provider: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/providers/:id/test', requireAdminAuth, async (req, res) => {
  try {
    const result = await providerManager.testProviderConnection(req.params.id, req.body);
    const updatedConfig = providerManager.getConfig(req.params.id);
    if (updatedConfig) {
      store.saveProvider(updatedConfig);
    }
    store.addLog({
      type: 'provider_sync',
      title: `Teste de Conexão com Provedor (${req.params.id})`,
      details: result.message,
      endpoint: `/api/v1/providers/${req.params.id}/test`,
      statusCode: result.success ? 200 : 502,
      success: result.success,
    });
    res.json({ success: result.success, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Developer Portal: Bank Account (Definições)
// ----------------------------------------------------
app.get('/api/v1/bank-account', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const userId = session?.userId || 'usr_admin_mauricio';
    const account = store.getBankAccount(userId);
    res.json({ success: true, bankAccount: account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/bank-account', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const userId = session?.userId || 'usr_admin_mauricio';
    const { holderName, bankName, iban, accountNumber } = req.body;

    if (!holderName || !bankName || !iban) {
      return res.status(400).json({ success: false, error: 'Titular, Nome do Banco e IBAN são obrigatórios.' });
    }

    const cleanIban = iban.replace(/\s+/g, '');
    const saved = store.saveBankAccount({
      id: `bank_${Date.now()}`,
      userId,
      holderName,
      bankName,
      iban: cleanIban,
      accountNumber: accountNumber || cleanIban.substring(4, 15),
      isVerified: true,
      updatedAt: new Date().toISOString(),
    });

    store.addLog({
      type: 'api_request',
      title: 'Conta Bancária de Liquidação Atualizada',
      details: `${holderName} | ${bankName} (${cleanIban})`,
      endpoint: '/api/v1/bank-account',
      statusCode: 200,
      success: true,
    });

    res.json({ success: true, bankAccount: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Developer Portal: KYC Verification
// ----------------------------------------------------
app.get('/api/v1/kyc', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const userId = session?.userId;
    const documents = store.getKycDocuments(userId);
    res.json({ success: true, documents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/kyc', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const { docType, fileName, fileSize, fileData } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, error: 'Ficheiro de identificação é obrigatório.' });
    }

    const docLabels: Record<string, string> = {
      identity: 'Documento de identidade (BI ou passaporte)',
      address: 'Comprovativo de morada ou residência',
      business: 'Certidão Comercial ou Registo de Empresa',
    };

    const newDoc: any = {
      id: `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: session?.userId || 'usr_admin_mauricio',
      userEmail: session?.userEmail || 'kaleyapt@gmail.com',
      docType: docType || 'identity',
      docTypeLabel: docLabels[docType] || 'Documento de identificação',
      fileName,
      fileSize: fileSize || '1.5 MB',
      fileData: fileData || undefined,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      notes: 'Submissão enviada para análise de conformidade KYC.',
    };

    store.saveKycDocument(newDoc);
    store.addLog({
      type: 'api_request',
      title: `Submissão KYC Enviada: ${fileName}`,
      details: `Tipo: ${newDoc.docTypeLabel} | Utilizador: ${newDoc.userEmail}`,
      endpoint: '/api/v1/kyc',
      statusCode: 201,
      success: true,
    });

    res.status(201).json({ success: true, document: newDoc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/kyc/:id/review', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!status || !['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado KYC inválido (verified, rejected, pending)' });
    }

    const updated = store.updateKycStatus(req.params.id, status, notes);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Documento KYC não encontrado' });
    }

    store.addLog({
      type: 'api_request',
      title: `Documento KYC ${status === 'verified' ? 'Aprovado' : 'Rejeitado'}`,
      details: `Documento ID: ${req.params.id} | Notas: ${notes || 'Sem observações adicionais'}`,
      endpoint: `/api/v1/kyc/${req.params.id}/review`,
      statusCode: 200,
      success: true,
    });

    res.json({ success: true, document: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Developer Portal: Levantamentos (Withdrawals)
// ----------------------------------------------------
app.get('/api/v1/withdrawals', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const withdrawals = store.getWithdrawals(session?.role === 'super_admin' ? undefined : session?.userId);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/withdrawals', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const userId = session?.userId || 'usr_admin_mauricio';
    const userEmail = session?.userEmail || 'kaleyapt@gmail.com';
    const { amount } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      return res.status(400).json({ success: false, error: 'O valor mínimo para levantamento é de 1.000,00 Kz.' });
    }

    const stats = store.getStats();
    const available = stats.availableBalance || 0;
    if (numAmount > available && available > 0) {
      return res.status(400).json({
        success: false,
        error: `Saldo disponível insuficiente (${available.toLocaleString('pt-AO')} Kz).`,
      });
    }

    const bank = store.getBankAccount(userId);
    if (!bank || !bank.iban) {
      return res.status(400).json({
        success: false,
        error: 'É necessário configurar uma conta bancária de liquidação nas Definições antes de solicitar levantamentos.',
      });
    }

    const fee = Math.round(numAmount * 0.01); // 1% fee de processamento bancário
    const netAmount = numAmount - fee;

    const newWithdrawal: any = {
      id: `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userEmail,
      amount: numAmount,
      fee,
      netAmount,
      currency: 'AOA',
      bankAccount: {
        holderName: bank.holderName,
        bankName: bank.bankName,
        iban: bank.iban,
      },
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    store.createWithdrawal(newWithdrawal);
    store.addLog({
      type: 'api_request',
      title: `Pedido de Levantamento Criado: ${numAmount.toLocaleString('pt-AO')} Kz`,
      details: `Conta BAI: ${bank.iban} | Titular: ${bank.holderName}`,
      endpoint: '/api/v1/withdrawals',
      statusCode: 201,
      success: true,
    });

    res.status(201).json({ success: true, withdrawal: newWithdrawal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/withdrawals/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { status, adminNotes, receiptReference } = req.body;
    if (!status || !['completed', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado de levantamento inválido.' });
    }

    const updated = store.updateWithdrawalStatus(req.params.id, status, adminNotes, receiptReference);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pedido de levantamento não encontrado.' });
    }

    store.addLog({
      type: 'api_request',
      title: `Levantamento ${status === 'completed' ? 'Liquidado com Sucesso' : status}`,
      details: `Ref: ${receiptReference || 'N/A'} | Notas: ${adminNotes || 'Processamento bancário concluído'}`,
      endpoint: `/api/v1/withdrawals/${req.params.id}`,
      statusCode: 200,
      success: true,
    });

    res.json({ success: true, withdrawal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Developer Portal: Consolidated Summary & Metrics
// ----------------------------------------------------
app.get('/api/v1/developer/summary', requireAdminAuth, (req: CustomRequest, res: Response) => {
  try {
    const session = validateSessionToken(req.headers['authorization'] || '');
    const userId = session?.userId || 'usr_admin_mauricio';

    const stats = store.getStats();
    const bankAccount = store.getBankAccount(userId);
    const kycDocs = store.getKycDocuments(userId);
    const apps = store.getApps();
    const charges = store.getCharges();

    // Map charges to Developer view (Bruto, Taxa 1.5%, Líquido, Estado, Data)
    const formattedTransactions = charges.slice(0, 10).map((c) => {
      const feeRate = 0.015;
      const fee = Math.round(c.amount * feeRate);
      const net = c.amount - fee;
      return {
        id: c.id,
        merchantTransactionId: c.merchantTransactionId,
        providerChargeId: c.providerChargeId,
        method: c.method,
        appName: c.appName || 'Chave inicial',
        grossAmount: c.amount,
        feeAmount: fee,
        netAmount: net,
        currency: c.currency,
        status: c.status,
        description: c.description,
        createdAt: c.createdAt,
        referenceDetails: c.referenceDetails,
      };
    });

    const isKycVerified = kycDocs.some((d) => d.status === 'verified');

    res.json({
      success: true,
      summary: {
        totalSalesVolume: stats.totalSalesVolume,
        availableBalance: stats.availableBalance || 0,
        approvedPaymentsCount: stats.approvedPaymentsCount,
        pendingPaymentsCount: stats.pendingPaymentsCount,
        failedPaymentsCount: stats.failedPaymentsCount,
        totalTransactionsCount: stats.totalTransactionsCount,
        conversionRate: stats.conversionRate,
        todayHourlyVolume: stats.todayHourlyVolume || [],
        dailyVolume: stats.dailyVolume || [],
        recentTransactions: formattedTransactions,
        bankAccount,
        kycStatus: isKycVerified ? 'verified' : kycDocs.length > 0 ? 'pending' : 'unsubmitted',
        kycDocuments: kycDocs,
        projects: apps,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Webhook Test Dispatcher for Clients
// ----------------------------------------------------
app.post('/api/v1/webhooks/test', requireAdminAuth, async (req, res) => {
  try {
    const { url, secret, event } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL do webhook é obrigatória' });
    }

    const testResult = await testWebhookEndpoint(url, secret || 'whsec_test', event || 'charge.paid');
    res.json({ success: true, result: testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// System & Webhook Logs
// ----------------------------------------------------
app.get('/api/v1/logs', requireAdminAuth, (_req, res) => {
  try {
    const logs = store.getLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Vite Middleware / Static Serving
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Payment Gateway Platform server running on http://0.0.0.0:${PORT}`);
  });
}

start();
