import { 
  Charge, 
  PaymentLink, 
  Product, 
  ClientApp, 
  ProviderConfig, 
  AuditLog, 
  GatewayStats, 
  AdminUser, 
  AuthResponse,
  BankAccount,
  KycDocument,
  WithdrawalRequest
} from '../types';

const TOKEN_KEY = 'gateway_admin_token';
const USER_KEY = 'gateway_admin_user';

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

const getHeaders = (extraHeaders?: Record<string, string>): HeadersInit => {
  const headers: Record<string, string> = {
    ...extraHeaders,
  };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }
  return res;
};

export const api = {
  // Auth
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser: (): AdminUser | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha na autenticação');
    }
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    companyName?: string;
    role?: 'merchant' | 'customer';
  }): Promise<AuthResponse & { app?: ClientApp }> => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha no registo de conta');
    }
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  getProfile: async (): Promise<AdminUser> => {
    const res = await handleResponse(await fetch('/api/v1/auth/profile', { headers: getHeaders() }));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar perfil');
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data.user;
  },

  updateProfile: async (payload: {
    name?: string;
    phone?: string;
    companyName?: string;
    avatarUrl?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ user: AdminUser; message: string }> => {
    const res = await handleResponse(
      await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil');
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  // User Management for Super Admin
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await handleResponse(await fetch('/api/v1/users', { headers: getHeaders() }));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao listar utilizadores');
    return data.users || [];
  },

  createUser: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    companyName?: string;
    platformFeePercentage?: number;
  }): Promise<{ user: AdminUser; message: string }> => {
    const res = await handleResponse(
      await fetch('/api/v1/users', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar utilizador');
    return data;
  },

  updateUser: async (id: string, payload: any): Promise<{ user: AdminUser; message: string }> => {
    const res = await handleResponse(
      await fetch(`/api/v1/users/${id}`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar utilizador');
    return data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await handleResponse(
      await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao remover utilizador');
    return data;
  },

  checkAuth: async (): Promise<AdminUser | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: getHeaders(),
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
  },

  // Stats
  getStats: async (): Promise<GatewayStats> => {
    const res = await handleResponse(await fetch('/api/v1/stats', { headers: getHeaders() }));
    const data = await res.json();
    return data.stats;
  },

  // Charges
  getCharges: async (params?: { status?: string; method?: string; appId?: string; search?: string }): Promise<Charge[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.method) query.set('method', params.method);
    if (params?.appId) query.set('appId', params.appId);
    if (params?.search) query.set('search', params.search);

    const res = await handleResponse(await fetch(`/api/v1/charges?${query.toString()}`, { headers: getHeaders() }));
    const data = await res.json();
    return data.charges || [];
  },

  getCharge: async (id: string): Promise<Charge> => {
    const res = await fetch(`/api/v1/charges/${id}`, { headers: getHeaders() });
    const data = await res.json();
    return data.charge;
  },

  getCustomerPurchases: async (email?: string): Promise<Charge[]> => {
    const url = email ? `/api/v1/customer/purchases?email=${encodeURIComponent(email)}` : `/api/v1/customer/purchases`;
    const res = await handleResponse(await fetch(url, { headers: getHeaders() }));
    const data = await res.json();
    return data.purchases || [];
  },

  createCharge: async (payload: {
    amount: number;
    method: 'GPO' | 'GPR';
    phoneNumber?: string;
    merchantTransactionId?: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    paymentLinkId?: string;
    productId?: string;
  }): Promise<{ success: boolean; charge: Charge; message: string }> => {
    const res = await fetch('/api/v1/charges', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao criar cobrança');
    return data;
  },

  syncChargeStatus: async (id: string): Promise<Charge> => {
    const res = await handleResponse(
      await fetch(`/api/v1/charges/${id}/sync`, { method: 'POST', headers: getHeaders() })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao sincronizar estado');
    return data.charge;
  },

  simulatePayment: async (id: string): Promise<Charge> => {
    const res = await fetch(`/api/v1/charges/${id}/simulate-pay`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao simular aprovação');
    return data.charge;
  },

  // Payment Links
  getLinks: async (): Promise<PaymentLink[]> => {
    const res = await fetch('/api/v1/links');
    const data = await res.json();
    return data.links || [];
  },

  getLink: async (idOrSlug: string): Promise<PaymentLink | null> => {
    const res = await fetch(`/api/v1/links/${idOrSlug}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.link || null;
  },

  createLink: async (payload: Partial<PaymentLink>): Promise<PaymentLink> => {
    const res = await handleResponse(
      await fetch('/api/v1/links', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar link');
    return data.link;
  },

  updateLink: async (id: string, payload: Partial<PaymentLink>): Promise<PaymentLink> => {
    const res = await handleResponse(
      await fetch(`/api/v1/links/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar link');
    return data.link;
  },

  deleteLink: async (id: string): Promise<boolean> => {
    const res = await handleResponse(
      await fetch(`/api/v1/links/${id}`, { method: 'DELETE', headers: getHeaders() })
    );
    const data = await res.json();
    return data.success;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch('/api/v1/products');
    const data = await res.json();
    return data.products || [];
  },

  createProduct: async (payload: Partial<Product> & { createLink?: boolean }): Promise<Product> => {
    const res = await handleResponse(
      await fetch('/api/v1/products', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar produto');
    return data.product;
  },

  updateProduct: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const res = await handleResponse(
      await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar produto');
    return data.product;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await handleResponse(
      await fetch(`/api/v1/products/${id}`, { method: 'DELETE', headers: getHeaders() })
    );
    const data = await res.json();
    return data.success;
  },

  // Apps
  getApps: async (): Promise<ClientApp[]> => {
    const res = await handleResponse(await fetch('/api/v1/apps', { headers: getHeaders() }));
    const data = await res.json();
    return data.apps || [];
  },

  createApp: async (payload: Partial<ClientApp>): Promise<ClientApp> => {
    const res = await handleResponse(
      await fetch('/api/v1/apps', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registar aplicação');
    return data.app;
  },

  updateApp: async (id: string, payload: Partial<ClientApp>): Promise<ClientApp> => {
    const res = await handleResponse(
      await fetch(`/api/v1/apps/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar aplicação');
    return data.app;
  },

  deleteApp: async (id: string): Promise<boolean> => {
    const res = await handleResponse(
      await fetch(`/api/v1/apps/${id}`, { method: 'DELETE', headers: getHeaders() })
    );
    const data = await res.json();
    return data.success;
  },

  // Providers
  getProviders: async (): Promise<ProviderConfig[]> => {
    const res = await handleResponse(await fetch('/api/v1/providers', { headers: getHeaders() }));
    const data = await res.json();
    return data.providers || [];
  },

  createProvider: async (payload: Partial<ProviderConfig>): Promise<ProviderConfig> => {
    const res = await handleResponse(
      await fetch('/api/v1/providers', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar provedor de gateway');
    return data.provider;
  },

  deleteProvider: async (id: string): Promise<boolean> => {
    const res = await handleResponse(
      await fetch(`/api/v1/providers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao remover provedor');
    return data.success;
  },

  updateProvider: async (id: string, payload: Partial<ProviderConfig>): Promise<ProviderConfig> => {
    const res = await handleResponse(
      await fetch(`/api/v1/providers/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar provedor');
    return data.provider;
  },

  testProvider: async (
    id: string,
    override?: Partial<ProviderConfig>
  ): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    const res = await handleResponse(
      await fetch(`/api/v1/providers/${id}/test`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: override ? JSON.stringify(override) : undefined,
      })
    );
    const data = await res.json();
    return data.result;
  },

  // Key rotation
  rotateAppKeys: async (appId: string, keyType: 'live' | 'test' | 'all' = 'all'): Promise<ClientApp> => {
    const res = await handleResponse(
      await fetch(`/api/v1/apps/${appId}/rotate-keys`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ keyType }),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao regenerar chaves');
    return data.app;
  },

  // Developer Bank Account
  getBankAccount: async (): Promise<BankAccount> => {
    const res = await handleResponse(await fetch('/api/v1/bank-account', { headers: getHeaders() }));
    const data = await res.json();
    return data.bankAccount;
  },

  saveBankAccount: async (payload: Partial<BankAccount>): Promise<BankAccount> => {
    const res = await handleResponse(
      await fetch('/api/v1/bank-account', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar conta bancária');
    return data.bankAccount;
  },

  // Developer KYC Documents
  getKycDocuments: async (): Promise<KycDocument[]> => {
    const res = await handleResponse(await fetch('/api/v1/kyc', { headers: getHeaders() }));
    const data = await res.json();
    return data.documents || [];
  },

  submitKyc: async (payload: { docType: string; fileName: string; fileSize: string; fileData?: string }): Promise<KycDocument> => {
    const res = await handleResponse(
      await fetch('/api/v1/kyc', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao submeter documento KYC');
    return data.document;
  },

  reviewKyc: async (id: string, status: 'verified' | 'rejected' | 'pending', notes?: string): Promise<KycDocument> => {
    const res = await handleResponse(
      await fetch(`/api/v1/kyc/${id}/review`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, notes }),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao rever documento KYC');
    return data.document;
  },

  // Developer Withdrawals
  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const res = await handleResponse(await fetch('/api/v1/withdrawals', { headers: getHeaders() }));
    const data = await res.json();
    return data.withdrawals || [];
  },

  createWithdrawal: async (amount: number): Promise<WithdrawalRequest> => {
    const res = await handleResponse(
      await fetch('/api/v1/withdrawals', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ amount }),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao solicitar levantamento');
    return data.withdrawal;
  },

  updateWithdrawal: async (
    id: string,
    status: 'completed' | 'pending' | 'rejected',
    adminNotes?: string,
    receiptReference?: string
  ): Promise<WithdrawalRequest> => {
    const res = await handleResponse(
      await fetch(`/api/v1/withdrawals/${id}`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, adminNotes, receiptReference }),
      })
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar levantamento');
    return data.withdrawal;
  },

  // Developer Consolidated Summary
  getDeveloperSummary: async (): Promise<any> => {
    const res = await handleResponse(await fetch('/api/v1/developer/summary', { headers: getHeaders() }));
    const data = await res.json();
    return data.summary;
  },

  // Webhooks tester
  testWebhook: async (url: string, secret: string, event: string): Promise<any> => {
    const res = await handleResponse(
      await fetch('/api/v1/webhooks/test', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ url, secret, event }),
      })
    );
    const data = await res.json();
    return data.result;
  },

  // Logs
  getLogs: async (): Promise<AuditLog[]> => {
    const res = await handleResponse(await fetch('/api/v1/logs', { headers: getHeaders() }));
    const data = await res.json();
    return data.logs || [];
  },
};
