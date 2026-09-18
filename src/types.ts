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
  userId?: string;
  userEmail?: string;
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
  referenceEntity?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
  environment: 'live' | 'test';
  platformFeeRate?: number;
  platformFee?: number;
  netAmount?: number;
  createdAt: string;
  paidAt?: string;
  failedAt?: string;
  errorMessage?: string;
  providerRawResponse?: any;
}

export interface CheckoutTestimonial {
  id?: string;
  author: string;
  role?: string;
  comment: string;
  rating: number;
}

export interface CheckoutCustomization {
  brandName?: string;
  brandColor?: string; // hex color e.g. #059669
  accentColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  guaranteeBadge?: boolean;
  guaranteeDays?: number; // 7, 14, 30
  guaranteeText?: string;
  showCountdown?: boolean;
  countdownMinutes?: number;
  showTestimonials?: boolean;
  testimonials?: CheckoutTestimonial[];
  supportPhone?: string;
  supportEmail?: string;
  theme?: 'modern' | 'minimal' | 'dark';
}

export interface PaymentLink {
  id: string;
  slug: string;
  appId?: string;
  userId?: string;
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
  customization?: CheckoutCustomization;
  digitalFileUrl?: string;
}

export interface Product {
  id: string;
  appId?: string;
  userId?: string;
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
  customization?: CheckoutCustomization;
  digitalFileUrl?: string;
  digitalFileName?: string;
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
  type: 'webhook_received' | 'webhook_dispatched' | 'api_request' | 'provider_sync' | 'system_error' | 'provider_config' | 'charge_status';
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
  totalPlatformRevenue?: number;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  companyName?: string;
  role: 'super_admin' | 'admin' | 'developer' | 'merchant' | 'support' | 'superadmin' | 'finance' | 'customer';
  status?: 'active' | 'inactive' | 'blocked';
  platformFeePercentage?: number;
  kycStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  kycNotes?: string;
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  defaultCheckoutCustomization?: CheckoutCustomization;
  createdAt?: string;
  lastLoginAt?: string;
  stats?: {
    totalApps: number;
    totalCharges: number;
    totalSalesVolume: number;
    totalProducts?: number;
    totalLinks?: number;
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
}

export interface PlatformSettings {
  platformName: string;
  platformLogoUrl?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  updatedAt?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpFrom?: string;
}
