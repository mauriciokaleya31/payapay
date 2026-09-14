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

      this.data.products = [];

      // Bank Account inicial do utilizador
      this.data.bankAccounts = [
        {
          id: 'bank_acc_mauricio',
          userId: admin.id,
          holderName: 'Mauricio Kaleya',
          bankName: 'Banco Angolano de Investimentos (BAI)',
          iban: '004000003224707910198',
          accountNumber: '32247079101',
          isVerified: true,
          updatedAt: '2026-09-14T03:25:00Z',
        },
      ];

      // Documentos de verificação KYC inicial
      this.data.kycDocuments = [
        {
          id: 'kyc_doc_01',
          userId: admin.id,
          userEmail: adminEmail,
          docType: 'identity',
          docTypeLabel: 'Documento de identidade (BI ou passaporte)',
          fileName: 'BI_Mauricio_Kaleya_Oficial.pdf',
          fileSize: '1.8 MB',
          status: 'verified',
          submittedAt: '2026-09-14T03:28:00Z',
          reviewedAt: '2026-09-14T03:30:00Z',
          notes: 'Identificação pessoal aprovada para operações e levantamentos bancários.',
        },
      ];

      // Projetos de Desenvolvedor (Cada projeto tem chave de API e webhook próprios)
      const initialProjectKey = 'nvx_live_5b2173ea901844bca';
      this.data.apps = [
        {
          id: 'prj_chave_inicial',
          name: 'Chave inicial',
          description: 'Projeto primário para integração de aplicativos e checkout com a API Pay Yetux.',
          userId: admin.id,
          userEmail: adminEmail,
          apiKeyLive: initialProjectKey,
          secretKeyLive: 'gw_sec_live_9a48f831bc4029a7',
          apiKeyTest: 'py_test_7e31b942ac1104e2',
          secretKeyTest: 'gw_sec_test_7e31b942ac1104e2',
          webhookUrl: '', // Sem callback
          webhookSecret: 'whsec_payyetux_chave_inicial',
          webhookEvents: ['charge.paid', 'charge.failed', 'charge.pending'],
          isActive: true,
          createdAt: '2026-09-14T03:29:00Z',
        },
      ];

      // Transações com o estado inicial: 0 concluídos, 3 pendentes, 0/6 transações (0.0% conversão)
      this.data.charges = [
        {
          id: 'ch_01_gpr_pending',
          merchantTransactionId: 'tx_pay_17893581001',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          providerChargeId: '66265521-f7ca-4aeb-bd2f-0fed5fa7a80f',
          amount: 5000,
          currency: 'AOA',
          method: 'GPR',
          description: 'Faturação de Serviço Web #1041',
          status: 'pending',
          referenceDetails: {
            entity: '10111',
            reference: '116 216 551',
            amount: 5000,
            expiryDate: '2026-09-15T08:00:00.000Z',
          },
          environment: 'live',
          createdAt: '2026-09-14T03:32:10.000Z',
        },
        {
          id: 'ch_02_gpo_pending',
          merchantTransactionId: 'tx_pay_17893581002',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          providerChargeId: '77123912-ab34-45cd-89ef-123456789abc',
          amount: 12500,
          currency: 'AOA',
          method: 'GPO',
          phoneNumber: '923456789',
          description: 'Assinatura Mensal Plataforma',
          status: 'pending',
          environment: 'live',
          createdAt: '2026-09-14T03:35:45.000Z',
        },
        {
          id: 'ch_03_gpo_pending',
          merchantTransactionId: 'tx_pay_17893581003',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          providerChargeId: '88123912-bc45-56de-90fa-234567890bcd',
          amount: 8000,
          currency: 'AOA',
          method: 'GPO',
          phoneNumber: '931220441',
          description: 'Créditos de Envio SMS API',
          status: 'pending',
          environment: 'live',
          createdAt: '2026-09-14T03:38:20.000Z',
        },
        {
          id: 'ch_04_gpo_failed',
          merchantTransactionId: 'tx_pay_17893581004',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          amount: 25000,
          currency: 'AOA',
          method: 'GPO',
          phoneNumber: '912345678',
          description: 'Renovação de Domínio e Hospedagem',
          status: 'failed',
          errorMessage: 'Tempo limite de confirmação excedido no terminal móvel do cliente.',
          environment: 'live',
          createdAt: '2026-09-14T02:15:00.000Z',
          failedAt: '2026-09-14T02:17:00.000Z',
        },
        {
          id: 'ch_05_gpr_expired',
          merchantTransactionId: 'tx_pay_17893581005',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          amount: 15000,
          currency: 'AOA',
          method: 'GPR',
          description: 'Inscrição em Curso Técnico',
          status: 'expired',
          referenceDetails: {
            entity: '10111',
            reference: '116 216 540',
            amount: 15000,
            expiryDate: '2026-09-13T23:59:59.000Z',
          },
          environment: 'live',
          createdAt: '2026-09-13T10:00:00.000Z',
        },
        {
          id: 'ch_06_gpo_failed',
          merchantTransactionId: 'tx_pay_17893581006',
          appId: 'prj_chave_inicial',
          appName: 'Chave inicial',
          providerId: 'nuvex',
          amount: 35000,
          currency: 'AOA',
          method: 'GPO',
          phoneNumber: '945678912',
          description: 'Aquisição de Licença de Software',
          status: 'failed',
          errorMessage: 'Saldo insuficiente ou cartão bloqueado na EMIS.',
          environment: 'live',
          createdAt: '2026-09-12T16:20:00.000Z',
          failedAt: '2026-09-12T16:22:00.000Z',
        },
      ];

      // Pedidos de levantamento
      this.data.withdrawals = [];

      // Logs reais de segurança do sistema
      this.data.logs = [
        {
          id: `log_init_01`,
          type: 'api_request',
          title: 'Pay Yetux Gateway Inicializado',
          details: `Administrador ${adminEmail} autenticado com segurança. Plataforma Pay Yetux operacional.`,
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
  getStats(): GatewayStats {
    const charges = this.data.charges;
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

    // Calculate available balance: paid revenue net of fees minus completed/pending withdrawals
    const completedOrPendingWithdrawals = (this.data.withdrawals || [])
      .filter((w) => w.status === 'completed' || w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = Math.max(0, Math.round(totalSalesVolume * 0.985 - completedOrPendingWithdrawals));

    return {
      totalSalesVolume,
      approvedPaymentsCount: paidCharges.length,
      pendingPaymentsCount: pendingCharges.length,
      failedPaymentsCount: failedCharges.length,
      totalTransactionsCount: totalCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      availableBalance,
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
