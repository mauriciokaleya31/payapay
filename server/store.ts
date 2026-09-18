import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Charge, 
  PaymentLink, 
  Product, 
  ClientApp, 
  AuditLog, 
  GatewayStats, 
  AdminUser, 
  AuthSession, 
  ProviderConfig,
  BankAccount,
  KycDocument,
  WithdrawalRequest
} from './types.js';

interface DatabaseSchema {
  users: AdminUser[];
  sessions: AuthSession[];
  charges: Charge[];
  links: PaymentLink[];
  products: Product[];
  apps: ClientApp[];
  logs: AuditLog[];
  providers?: ProviderConfig[];
  bankAccounts?: BankAccount[];
  kycDocuments?: KycDocument[];
  withdrawals?: WithdrawalRequest[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'gateway_db.json');

// Helper to hash password
export function createAdminPasswordHash(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

class MemoryAndFileStore {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    charges: [],
    links: [],
    products: [],
    apps: [],
    logs: [],
    providers: [],
    bankAccounts: [],
    kycDocuments: [],
    withdrawals: [],
  };

  constructor() {
    this.loadFromDisk();
    this.ensureAdminAndCleanRealData();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          sessions: parsed.sessions || [],
          charges: parsed.charges || [],
          links: parsed.links || [],
          products: parsed.products || [],
          apps: parsed.apps || [],
          logs: parsed.logs || [],
          providers: parsed.providers || [],
          bankAccounts: parsed.bankAccounts || [],
          kycDocuments: parsed.kycDocuments || [],
          withdrawals: parsed.withdrawals || [],
        };
      }
    } catch (err) {
      console.warn('[Store] Could not load stored database file, starting fresh:', err);
    }
  }

  public persistToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Store] Failed to persist data to disk:', err);
    }
  }

  /**
   * Garantir que o administrador requisitado está cadastrado e que os dados
   * persistentes do utilizador NUNCA são apagados ou reinicializados.
   */
  public ensureAdminAndCleanRealData() {
    const adminEmail = 'kaleyapt@gmail.com';
    const adminPass = 'Mauricio.200';

    let admin = this.data.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());

    if (!admin) {
      const { hash, salt } = createAdminPasswordHash(adminPass);
      admin = {
        id: 'usr_admin_mauricio',
        email: adminEmail,
        name: 'Maurício',
        phone: '+244 923 000 000',
        companyName: 'Pay Yetux Gateway',
        role: 'super_admin',
        passwordHash: hash,
        passwordSalt: salt,
        status: 'active',
        platformFeePercentage: 20,
        createdAt: new Date().toISOString(),
      };
      this.data.users.unshift(admin);
    }

    // Certificar que cobranças possuem taxa de plataforma de 20%
    for (const c of this.data.charges) {
      if (!c.platformFeeRate) {
        c.platformFeeRate = 0.20; // 20% taxa Pay Yetux
      }
      if (c.platformFee === undefined) {
        c.platformFee = Math.round(c.amount * (c.platformFeeRate || 0.20));
      }
      if (c.netAmount === undefined) {
        c.netAmount = c.amount - c.platformFee;
      }
      if (!c.userId && admin) {
        c.userId = admin.id;
      }
    }

    // Se ainda não houver nenhum projeto cadastrado (primeira inicialização)
    if (this.data.apps.length === 0) {
      const initialProjectKey = 'nvx_live_5b2173ea901844bca';
      this.data.apps.push({
        id: 'prj_chave_inicial',
        name: 'Chave inicial',
        description: 'Projeto primário para integração de pagamentos e checkout com a API Pay Yetux.',
        userId: admin.id,
        userEmail: adminEmail,
        apiKeyLive: initialProjectKey,
        secretKeyLive: 'gw_sec_live_9a48f831bc4029a7',
        apiKeyTest: 'py_test_7e31b942ac1104e2',
        secretKeyTest: 'gw_sec_test_7e31b942ac1104e2',
        webhookUrl: '',
        webhookSecret: 'whsec_payyetux_chave_inicial',
        webhookEvents: ['charge.paid', 'charge.failed', 'charge.pending'],
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    this.persistToDisk();
  }

  // --- Users & Authentication ---
  getUserByEmail(email: string): AdminUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserById(id: string): AdminUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  saveUser(user: AdminUser): AdminUser {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.persistToDisk();
    return user;
  }

  deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user || user.role === 'super_admin') {
      return false; // Don't delete super admin
    }
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== id);
    this.persistToDisk();
    return this.data.users.length < prevLen;
  }

  getUsers(): Omit<AdminUser, 'passwordHash' | 'passwordSalt'>[] {
    return this.data.users.map(({ passwordHash, passwordSalt, ...safe }) => safe);
  }

  getUsersWithStats(): Omit<AdminUser, 'passwordHash' | 'passwordSalt'>[] {
    return this.data.users.map(({ passwordHash, passwordSalt, ...safe }) => {
      const userApps = this.data.apps.filter((a) => a.userId === safe.id);
      const appIds = new Set(userApps.map((a) => a.id));
      const userCharges = this.data.charges.filter((c) => c.userId === safe.id || (c.appId && appIds.has(c.appId)));
      const paidCharges = userCharges.filter((c) => c.status === 'paid');
      const salesVolume = paidCharges.reduce((sum, c) => sum + c.amount, 0);
      const userProducts = (this.data.products || []).filter((p) => p.userId === safe.id || (!p.userId && safe.role === 'super_admin'));
      const userLinks = (this.data.links || []).filter((l) => l.userId === safe.id || (!l.userId && safe.role === 'super_admin'));

      return {
        ...safe,
        kycStatus: safe.kycStatus || (safe.role === 'merchant' ? 'pending' : (safe.role === 'super_admin' ? 'verified' : 'not_submitted')),
        stats: {
          totalApps: userApps.length,
          totalCharges: userCharges.length,
          totalSalesVolume: salesVolume,
          totalProducts: userProducts.length,
          totalLinks: userLinks.length,
        },
      };
    });
  }

  getOrCreateCustomerAccount(
    email: string,
    name?: string,
    phone?: string
  ): { user: Omit<AdminUser, 'passwordHash' | 'passwordSalt'>; temporaryPassword?: string; isNew: boolean } {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Email é obrigatório para registo de conta de cliente');
    }

    const existing = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const { passwordHash, passwordSalt, ...safe } = existing;
      return { user: safe, isNew: false };
    }

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const temporaryPassword = `Cliente#${randomDigits}`;
    const { hash, salt } = createAdminPasswordHash(temporaryPassword);

    const newUser: AdminUser = {
      id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      phone: phone || '',
      role: 'customer',
      status: 'active',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.persistToDisk();

    this.addLog({
      type: 'webhook_received',
      title: `Conta de Cliente Criada Automaticamente: ${cleanEmail}`,
      details: `Credenciais geradas e enviadas por e-mail para ${cleanEmail}. Palavra-passe temporária: ${temporaryPassword}`,
      endpoint: '/api/v1/customer/auto-register',
      statusCode: 200,
      success: true,
    });

    const { passwordHash, passwordSalt, ...safe } = newUser;
    return { user: safe, temporaryPassword, isNew: true };
  }

  getCustomerPurchases(emailOrUserId: string): Charge[] {
    const q = emailOrUserId.trim().toLowerCase();
    return this.data.charges
      .filter(
        (c) =>
          (c.customerEmail && c.customerEmail.toLowerCase() === q) ||
          c.userId === emailOrUserId
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Sessions ---
  getSession(token: string): AuthSession | undefined {
    return this.data.sessions.find((s) => s.token === token);
  }

  saveSession(session: AuthSession): AuthSession {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== session.token);
    this.data.sessions.push(session);
    this.cleanExpiredSessions();
    this.persistToDisk();
    return session;
  }

  deleteSession(token: string): boolean {
    const initial = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.persistToDisk();
    return this.data.sessions.length < initial;
  }

  cleanExpiredSessions() {
    const now = Date.now();
    this.data.sessions = this.data.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  }

  // --- Charges ---
  getCharges(userId?: string): Charge[] {
    let list = this.data.charges;
    if (userId) {
      const userApps = this.data.apps.filter((a) => a.userId === userId);
      const appIds = new Set(userApps.map((a) => a.id));
      list = list.filter((c) => c.userId === userId || (c.appId && appIds.has(c.appId)));
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getChargeById(id: string): Charge | undefined {
    return this.data.charges.find((c) => c.id === id || c.merchantTransactionId === id || c.providerChargeId === id);
  }

  saveCharge(charge: Charge): Charge {
    // Ensure 20% platform fee calculation
    if (!charge.platformFeeRate) {
      charge.platformFeeRate = 0.20;
    }
    if (charge.platformFee === undefined) {
      charge.platformFee = Math.round(charge.amount * charge.platformFeeRate);
    }
    if (charge.netAmount === undefined) {
      charge.netAmount = charge.amount - charge.platformFee;
    }

    const idx = this.data.charges.findIndex((c) => c.id === charge.id);
    if (idx >= 0) {
      this.data.charges[idx] = charge;
    } else {
      this.data.charges.unshift(charge);
    }
    this.persistToDisk();
    return charge;
  }

  // --- Links ---
  getLinks(): PaymentLink[] {
    return [...this.data.links].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getLinkById(idOrSlug: string): PaymentLink | undefined {
    return this.data.links.find((l) => l.id === idOrSlug || l.slug === idOrSlug);
  }

  saveLink(link: PaymentLink): PaymentLink {
    const idx = this.data.links.findIndex((l) => l.id === link.id);
    if (idx >= 0) {
      this.data.links[idx] = link;
    } else {
      this.data.links.unshift(link);
    }
    this.persistToDisk();
    return link;
  }

  deleteLink(id: string): boolean {
    const initialLen = this.data.links.length;
    this.data.links = this.data.links.filter((l) => l.id !== id);
    this.persistToDisk();
    return this.data.links.length < initialLen;
  }

  // --- Products ---
  getProducts(): Product[] {
    return [...this.data.products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      this.data.products.unshift(product);
    }
    this.persistToDisk();
    return product;
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.persistToDisk();
    return this.data.products.length < initialLen;
  }

  // --- Apps ---
  getApps(userId?: string): ClientApp[] {
    let list = this.data.apps;
    if (userId) {
      list = list.filter((a) => a.userId === userId);
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAppById(id: string): ClientApp | undefined {
    return this.data.apps.find((a) => a.id === id);
  }

  getAppByApiKey(apiKey: string): ClientApp | undefined {
    return this.data.apps.find((a) => a.apiKeyLive === apiKey || a.apiKeyTest === apiKey);
  }

  saveApp(app: ClientApp): ClientApp {
    const idx = this.data.apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      this.data.apps[idx] = app;
    } else {
      this.data.apps.unshift(app);
    }
    this.persistToDisk();
    return app;
  }

  deleteApp(id: string): boolean {
    const initialLen = this.data.apps.length;
    this.data.apps = this.data.apps.filter((a) => a.id !== id);
    this.persistToDisk();
    return this.data.apps.length < initialLen;
  }

  // --- Logs ---
  getLogs(): AuditLog[] {
    return [...this.data.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  }

  addLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AuditLog {
    const entry: AuditLog = {
      id: log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      ...log,
    };
    this.data.logs.unshift(entry);
    if (this.data.logs.length > 200) {
      this.data.logs = this.data.logs.slice(0, 200);
    }
    this.persistToDisk();
    return entry;
  }

  // --- Provider Configs Persistence ---
  getProviders(): ProviderConfig[] {
    return this.data.providers || [];
  }

  saveProvider(provider: ProviderConfig): void {
    if (!this.data.providers) {
      this.data.providers = [];
    }
    const idx = this.data.providers.findIndex((p) => p.id === provider.id);
    if (idx >= 0) {
      this.data.providers[idx] = provider;
    } else {
      this.data.providers.push(provider);
    }
    this.persistToDisk();
  }

  // --- Bank Account ---
  getBankAccount(userId: string): BankAccount {
    let acc = (this.data.bankAccounts || []).find((b) => b.userId === userId);
    if (!acc) {
      acc = {
        id: `bank_${Date.now()}`,
        userId,
        holderName: 'Mauricio Kaleya',
        bankName: 'Banco Angolano de Investimentos (BAI)',
        iban: '004000003224707910198',
        accountNumber: '32247079101',
        isVerified: true,
        updatedAt: new Date().toISOString(),
      };
      this.saveBankAccount(acc);
    }
    return acc;
  }

  saveBankAccount(account: BankAccount): BankAccount {
    if (!this.data.bankAccounts) this.data.bankAccounts = [];
    const idx = this.data.bankAccounts.findIndex((b) => b.id === account.id || b.userId === account.userId);
    if (idx >= 0) {
      this.data.bankAccounts[idx] = { ...this.data.bankAccounts[idx], ...account, updatedAt: new Date().toISOString() };
      account = this.data.bankAccounts[idx];
    } else {
      this.data.bankAccounts.push(account);
    }
    this.persistToDisk();
    return account;
  }

  // --- KYC Documents ---
  getKycDocuments(userId?: string): KycDocument[] {
    const list = this.data.kycDocuments || [];
    if (userId) {
      return list.filter((d) => d.userId === userId);
    }
    return list;
  }

  saveKycDocument(doc: KycDocument): KycDocument {
    if (!this.data.kycDocuments) this.data.kycDocuments = [];
    const idx = this.data.kycDocuments.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      this.data.kycDocuments[idx] = doc;
    } else {
      this.data.kycDocuments.unshift(doc);
    }
    this.persistToDisk();
    return doc;
  }

  updateKycStatus(id: string, status: 'verified' | 'pending' | 'rejected', notes?: string): KycDocument | undefined {
    if (!this.data.kycDocuments) return undefined;
    const doc = this.data.kycDocuments.find((d) => d.id === id);
    if (doc) {
      doc.status = status;
      doc.reviewedAt = new Date().toISOString();
      if (notes !== undefined) doc.notes = notes;
      this.persistToDisk();
    }
    return doc;
  }

  // --- Withdrawals ---
  getWithdrawals(userId?: string): WithdrawalRequest[] {
    const list = this.data.withdrawals || [];
    if (userId) {
      return list.filter((w) => w.userId === userId);
    }
    return list;
  }

  createWithdrawal(withdrawal: WithdrawalRequest): WithdrawalRequest {
    if (!this.data.withdrawals) this.data.withdrawals = [];
    this.data.withdrawals.unshift(withdrawal);
    this.persistToDisk();
    return withdrawal;
  }

  updateWithdrawalStatus(id: string, status: 'completed' | 'pending' | 'rejected', adminNotes?: string, receiptReference?: string): WithdrawalRequest | undefined {
    if (!this.data.withdrawals) return undefined;
    const req = this.data.withdrawals.find((w) => w.id === id);
    if (req) {
      req.status = status;
      req.processedAt = new Date().toISOString();
      if (adminNotes) req.adminNotes = adminNotes;
      if (receiptReference) req.receiptReference = receiptReference;
      this.persistToDisk();
    }
    return req;
  }

  deleteProvider(id: string): boolean {
    if (!this.data.providers) return false;
    const initialLen = this.data.providers.length;
    this.data.providers = this.data.providers.filter((p) => p.id !== id);
    this.persistToDisk();
    return this.data.providers.length < initialLen;
  }

  // --- Stats Calculation ---
  getStats(userId?: string): GatewayStats {
    let charges = this.data.charges;
    if (userId) {
      const userApps = this.data.apps.filter((a) => a.userId === userId);
      const appIds = new Set(userApps.map((a) => a.id));
      charges = charges.filter((c) => c.userId === userId || (c.appId && appIds.has(c.appId)));
    }

    const paidCharges = charges.filter((c) => c.status === 'paid');
    const pendingCharges = charges.filter((c) => c.status === 'pending');
    const failedCharges = charges.filter((c) => c.status === 'failed' || c.status === 'cancelled' || c.status === 'expired');

    const totalSalesVolume = paidCharges.reduce((acc, curr) => acc + curr.amount, 0);

    const totalCount = charges.length;
    const conversionRate = totalCount > 0 ? (paidCharges.length / totalCount) * 100 : 0;

    const gpoVolume = paidCharges.filter((c) => c.method === 'GPO').reduce((a, b) => a + b.amount, 0);
    const gprVolume = paidCharges.filter((c) => c.method === 'GPR').reduce((a, b) => a + b.amount, 0);

    // Group daily volume over the last 7 days
    const dailyMap = new Map<string, { amount: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      dailyMap.set(key, { amount: 0, count: 0 });
    }

    for (const c of paidCharges) {
      const d = new Date(c.paidAt || c.createdAt);
      const key = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      if (dailyMap.has(key)) {
        const item = dailyMap.get(key)!;
        item.amount += c.amount;
        item.count += 1;
      }
    }

    const dailyVolume = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      amount: val.amount,
      count: val.count,
    }));

    // Hourly volume for today (00:00 to 23:00)
    const todayStr = new Date().toISOString().slice(0, 10);
    const hourlyMap = new Map<number, { amount: number; count: number }>();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { amount: 0, count: 0 });
    }

    for (const c of paidCharges) {
      const chargeDate = new Date(c.paidAt || c.createdAt);
      if (chargeDate.toISOString().slice(0, 10) === todayStr) {
        const hour = chargeDate.getHours();
        const current = hourlyMap.get(hour) || { amount: 0, count: 0 };
        current.amount += c.amount;
        current.count += 1;
        hourlyMap.set(hour, current);
      }
    }

    const todayHourlyVolume = Array.from(hourlyMap.entries()).map(([hourNum, val]) => ({
      hour: `${hourNum.toString().padStart(2, '0')}:00`,
      amount: val.amount,
      count: val.count,
    }));

    // Calculate available balance
    // Developer receives 80% (amount - 20% platform fee)
    // Withdrawals deducted for this user (or all if admin)
    const withdrawals = (this.data.withdrawals || []).filter((w) => (userId ? w.userId === userId : true));
    const completedOrPendingWithdrawals = withdrawals
      .filter((w) => w.status === 'completed' || w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    const netPaidTotal = paidCharges.reduce((sum, c) => sum + (c.netAmount !== undefined ? c.netAmount : Math.round(c.amount * 0.80)), 0);
    const availableBalance = Math.max(0, netPaidTotal - completedOrPendingWithdrawals);

    // Platform revenue (20% retained by Pay Yetux)
    const globalPaidCharges = this.data.charges.filter((c) => c.status === 'paid');
    const totalPlatformRevenue = globalPaidCharges.reduce((sum, c) => {
      const fee = c.platformFee !== undefined ? c.platformFee : Math.round(c.amount * (c.platformFeeRate || 0.20));
      return sum + fee;
    }, 0);

    const totalDevelopersCount = this.data.users.filter((u) => u.role === 'developer').length;
    
    // Active developers: developers with at least 1 app or charge
    const activeDevIds = new Set([
      ...this.data.apps.map((a) => a.userId).filter(Boolean),
      ...this.data.charges.map((c) => c.userId).filter(Boolean)
    ]);
    const activeDevelopersCount = this.data.users.filter((u) => u.role === 'developer' && activeDevIds.has(u.id)).length;
    const totalAppsCount = this.data.apps.filter((a) => a.isActive).length;

    return {
      totalSalesVolume,
      approvedPaymentsCount: paidCharges.length,
      pendingPaymentsCount: pendingCharges.length,
      failedPaymentsCount: failedCharges.length,
      totalTransactionsCount: totalCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      availableBalance,
      totalPlatformRevenue,
      totalDevelopersCount,
      activeDevelopersCount: Math.max(activeDevelopersCount, totalDevelopersCount > 0 ? 1 : 0),
      totalAppsCount,
      volumeByMethod: {
        gpo: gpoVolume,
        gpr: gprVolume,
      },
      dailyVolume,
      todayHourlyVolume,
    };
  }
}

export const store = new MemoryAndFileStore();
