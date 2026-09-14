export type PaymentMethodType = 'GPO' | 'GPR'; // GPO = Multicaixa Express, GPR = Referência

export type ChargeStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export interface ProviderConfig {
  id: string; // 'nuvex' | 'emis' | 'stripe' | etc.
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
  webhookEvents?: string[]; // ['charge.paid', 'charge.failed', 'charge.pending']
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalCharges: number;
    paidCharges: number;
    totalAmount: number;
  };
}

export interface PaymentReferenceDetails {
  entity: string; // e.g. "00123"
  reference: string; // e.g. "948 231 045"
  amount: number;
  expiryDate: string;
}

export interface Charge {
  id: string;
  merchantTransactionId: string;
  appId?: string;
  appName?: string;
  userId?: string;
  userEmail?: string;
  providerId: string;
  providerChargeId?: string;
  amount: number;
  currency: string; // "AOA"
  method: PaymentMethodType;
  phoneNumber?: string; // For GPO (Multicaixa Express)
  description?: string;
  customerEmail?: string;
  customerName?: string;
  status: ChargeStatus;
  paymentLinkId?: string;
  productId?: string;
  referenceDetails?: PaymentReferenceDetails; // For GPR
  metadata?: Record<string, any>;
  environment: 'live' | 'test';
  platformFeeRate: number; // e.g. 0.20 for 20%
  platformFee: number; // e.g. 2000 for 10000 gross
  netAmount: number; // e.g. 8000 (amount - platformFee)
  createdAt: string;
  paidAt?: string;
  failedAt?: string;
  errorMessage?: string;
  providerRawResponse?: any;
}

export interface PaymentLink {
  id: string;
  slug: string; // url identifier
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  companyName?: string;
  role: 'super_admin' | 'admin' | 'developer' | 'support';
  passwordHash: string;
  passwordSalt: string;
  status: 'active' | 'inactive' | 'blocked';
  platformFeePercentage?: number; // default 20%
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  stats?: {
    totalApps: number;
    totalCharges: number;
    totalSalesVolume: number;
  };
}

export interface AuthSession {
  token: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  ip?: string;
  userAgent?: string;
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

export interface BankAccount {
  id: string;
  userId: string;
  holderName: string;
  bankName: string;
  iban: string;
  accountNumber?: string;
  isVerified: boolean;
  updatedAt: string;
}

export interface KycDocument {
  id: string;
  userId: string;
  userEmail: string;
  docType: 'identity' | 'address' | 'business';
  docTypeLabel: string;
  fileName: string;
  fileSize: string;
  fileData?: string;
  status: 'verified' | 'pending' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string; // "AOA"
  bankAccount: {
    holderName: string;
    bankName: string;
    iban: string;
  };
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  receiptReference?: string;
  adminNotes?: string;
}

export interface GatewayStats {
  totalSalesVolume: number;
  approvedPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  totalTransactionsCount: number;
  conversionRate: number;
  availableBalance?: number;
  totalPlatformRevenue?: number; // 20% platform fees retained by Pay Yetux
  totalDevelopersCount?: number;
  activeDevelopersCount?: number;
  totalAppsCount?: number;
  volumeByMethod: {
    gpo: number;
    gpr: number;
  };
  dailyVolume: {
    date: string;
    amount: number;
    count: number;
  }[];
  todayHourlyVolume?: {
    hour: string;
    amount: number;
    count: number;
  }[];
}
