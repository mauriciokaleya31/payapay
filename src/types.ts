export type PaymentMethodType = 'GPO' | 'GPR';

export type ChargeStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export interface PaymentReferenceDetails {
  entity: string;
  reference: string;
  amount: number;
  expiryDate: string;
}

export interface Charge {
  id: string;
  merchantTransactionId: string;
  appId?: string;
  appName?: string;
  providerId: string;
  providerChargeId?: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  phoneNumber?: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  status: ChargeStatus;
  paymentLinkId?: string;
  productId?: string;
  referenceDetails?: PaymentReferenceDetails;
  metadata?: Record<string, any>;
  environment: 'live' | 'test';
  createdAt: string;
  paidAt?: string;
  failedAt?: string;
  errorMessage?: string;
  providerRawResponse?: any;
}

export interface PaymentLink {
  id: string;
  slug: string;
  appId?: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  imageUrl?: string;
  allowedMethods: PaymentMethodType[];
  isActive: boolean;
  requiresCustomerName: boolean;
  requiresCustomerEmail: boolean;
  requiresCustomerPhone: boolean;
  totalViews: number;
  totalSalesCount: number;
  totalSalesAmount: number;
  createdAt: string;
  productId?: string;
}

export interface Product {
  id: string;
  appId?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  stock?: number;
  isActive: boolean;
  salesCount: number;
  createdAt: string;
  paymentLinkId?: string;
}

export interface ClientApp {
  id: string;
  name: string;
  description?: string;
  userId: string;
  userEmail: string;
  apiKeyLive: string;
  secretKeyLive: string;
  apiKeyTest: string;
  secretKeyTest: string;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  apiUrl: string;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  supportedMethods: PaymentMethodType[];
  testMode: boolean;
  lastConnectionTest?: {
    timestamp: string;
    success: boolean;
    latencyMs: number;
    message: string;
  };
}

export interface AuditLog {
  id: string;
  type: 'webhook_received' | 'webhook_dispatched' | 'api_request' | 'provider_sync' | 'system_error' | 'provider_config';
  title: string;
  details?: string;
  endpoint?: string;
  statusCode?: number;
  payload?: any;
  response?: any;
  success: boolean;
  timestamp: string;
  chargeId?: string;
  appId?: string;
}

export interface GatewayStats {
  totalSalesVolume: number;
  approvedPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  totalTransactionsCount: number;
  conversionRate: number;
  volumeByMethod: {
    gpo: number;
    gpr: number;
  };
  dailyVolume: {
    date: string;
    amount: number;
    count: number;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'finance';
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
}
