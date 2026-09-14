import { PaymentMethodType, ChargeStatus, PaymentReferenceDetails } from '../types.js';

export interface CreateChargeInput {
  amount: number;
  method: PaymentMethodType;
  phoneNumber?: string;
  merchantTransactionId: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface CreateChargeResult {
  success: boolean;
  providerChargeId?: string;
  status: ChargeStatus;
  referenceDetails?: PaymentReferenceDetails;
  rawResponse?: any;
  errorMessage?: string;
}

export interface CheckStatusResult {
  success: boolean;
  status: ChargeStatus;
  providerChargeId?: string;
  paidAt?: string;
  rawResponse?: any;
  errorMessage?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  createCharge(input: CreateChargeInput, config?: any): Promise<CreateChargeResult>;
  checkStatus(chargeIdOrMerchantTxId: string, config?: any): Promise<CheckStatusResult>;
  verifyWebhookSignature(signatureHeader: string | undefined, rawBody: string, secret: string): boolean;
  testConnection(config?: any): Promise<{ success: boolean; latencyMs: number; message: string }>;
}
