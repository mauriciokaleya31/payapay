import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Charge, PaymentLink, Product, ClientApp, AuditLog, GatewayStats, AdminUser, AuthSession, ProviderConfig } from './types.js';

interface DatabaseSchema {
  users: AdminUser[];
  sessions: AuthSession[];
  charges: Charge[];
  links: PaymentLink[];
  products: Product[];
  apps: ClientApp[];
  logs: AuditLog[];
  providers?: ProviderConfig[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'gateway_db.json');

// Helper to hash password
function createAdminPasswordHash(password: string, existingSalt?: string): { hash: string; salt: string } {
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
        };
      }
    } catch (err) {
      console.warn('[Store] Could not load stored database file, starting fresh:', err);
    }
  }

  private persistToDisk() {
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
   * Garantir que o administrador requisitado (kaleyapt@gmail.com / Mauricio.200)
   * está sempre cadastrado e que a base contém dados reais limpos e seguros.
   */
  public ensureAdminAndCleanRealData() {
    const adminEmail = 'kaleyapt@gmail.com';
    const adminPass = 'Mauricio.200';

    let admin = this.data.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
    const { hash, salt } = createAdminPasswordHash(adminPass);

    if (!admin) {
      admin = {
        id: 'usr_admin_mauricio',
        email: adminEmail,
        name: 'Maurício',
        role: 'super_admin',
        passwordHash: hash,
        passwordSalt: salt,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(admin);
    } else {
      // Atualizar com a senha exata requerida caso tenha mudado
      admin.name = admin.name || 'Maurício';
      admin.role = 'super_admin';
      admin.status = 'active';
      admin.passwordHash = hash;
      admin.passwordSalt = salt;
    }

    // Limpar dados fictícios se forem os dados de exemplo antigos ("Loja Luanda Digital", "Manuel Sebastião", etc)
    const hasFakeData = this.data.apps.some((a) => a.id === 'app_nuvex_commerce' || a.name === 'Loja Luanda Digital');
    if (hasFakeData || this.data.apps.length === 0) {
      // Substituir por dados reais associados ao Admin kaleyapt@gmail.com
      const officialAppId = 'app_gateway_angola';
      this.data.apps = [
        {
          id: officialAppId,
          name: 'Gateway Oficial Angola',
          description: 'Integração de pagamentos com Nuvex (Multicaixa Express e Referência Bancária).',
          userId: admin.id,
          userEmail: adminEmail,
          apiKeyLive: 'nvx_live_ao_984392482348',
          secretKeyLive: 'gw_sec_live_9a48f831bc4029a7',
          apiKeyTest: 'nvx_test_ao_123490812394',
          secretKeyTest: 'gw_sec_test_7e31b942ac1104e2',
          webhookUrl: '',
          webhookSecret: 'whsec_gateway_9941_real',
          webhookEvents: ['charge.paid', 'charge.failed', 'charge.pending'],
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      // Resetar cobranças fictícias antigas para manter dados reais limpos
      this.data.charges = [];

      // Links reais do admin prontos para uso
      this.data.links = [
        {
          id: 'link_cobranca_padrao',
          slug: 'pagamento-expresso',
          appId: officialAppId,
          title: 'Pagamento Expresso Multicaixa',
          description: 'Link seguro para recebimento de pagamentos via Multicaixa Express e Referência Bancária.',
          amount: 10000,
          currency: 'AOA',
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=600&auto=format&fit=crop&q=80',
          allowedMethods: ['GPO', 'GPR'],
          isActive: true,
          requiresCustomerName: true,
          requiresCustomerEmail: true,
          requiresCustomerPhone: true,
          totalViews: 0,
          totalSalesCount: 0,
          totalSalesAmount: 0,
          createdAt: new Date().toISOString(),
        },
      ];

      // Catálogo de produtos limpo pronto para o administrador
      this.data.products = [];

      // Logs reais de segurança do sistema
      this.data.logs = [
        {
          id: `log_init_01`,
          type: 'api_request',
          title: 'Sistema de Gateway e Segurança Inicializado',
          details: `Administrador ${adminEmail} cadastrado com autenticação segura. Painel pronto para operação real.`,
          endpoint: '/api/v1/auth',
          statusCode: 200,
          success: true,
          timestamp: new Date().toISOString(),
        },
      ];
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
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persistToDisk();
    return user;
  }

  getUsers(): Omit<AdminUser, 'passwordHash' | 'passwordSalt'>[] {
    return this.data.users.map(({ passwordHash, passwordSalt, ...safe }) => safe);
  }

  // --- Sessions ---
  getSession(token: string): AuthSession | undefined {
    return this.data.sessions.find((s) => s.token === token);
  }

  saveSession(session: AuthSession): AuthSession {
    // Remove existing sessions for the same token if any
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
  getCharges(): Charge[] {
    return [...this.data.charges].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getChargeById(id: string): Charge | undefined {
    return this.data.charges.find((c) => c.id === id || c.merchantTransactionId === id || c.providerChargeId === id);
  }

  saveCharge(charge: Charge): Charge {
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
  getApps(): ClientApp[] {
    return [...this.data.apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // --- Stats Calculation ---
  getStats(): GatewayStats {
    const charges = this.data.charges;
    const paidCharges = charges.filter((c) => c.status === 'paid');
    const pendingCharges = charges.filter((c) => c.status === 'pending');
    const failedCharges = charges.filter((c) => c.status === 'failed' || c.status === 'cancelled');

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

    return {
      totalSalesVolume,
      approvedPaymentsCount: paidCharges.length,
      pendingPaymentsCount: pendingCharges.length,
      failedPaymentsCount: failedCharges.length,
      totalTransactionsCount: totalCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      volumeByMethod: {
        gpo: gpoVolume,
        gpr: gprVolume,
      },
      dailyVolume,
    };
  }
}

export const store = new MemoryAndFileStore();
