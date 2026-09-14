import { PaymentProvider, CreateChargeInput, CreateChargeResult, CheckStatusResult } from './base.js';
import { ProviderConfig } from '../types.js';

export class GenericGatewayProvider implements PaymentProvider {
  public id: string;
  public name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async testConnection(config?: ProviderConfig): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    const apiUrl = config?.apiUrl?.trim();
    const apiKey = config?.apiKey?.trim();

    if (!apiUrl) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Endpoint de API (URL) não configurado para este gateway.',
      };
    }

    try {
      // Test endpoint using HEAD/GET or ping
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = {
        'User-Agent': 'PayYetux-Gateway/1.0',
        'Accept': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
      }

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      }).catch(async () => {
        // Fallback to POST ping if GET rejected
        return await fetch(apiUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ping: true }),
        });
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (res && res.status < 500) {
        return {
          success: true,
          latencyMs,
          message: `Comunicação estabelecida com sucesso com ${this.name} (${res.status} ${res.statusText} em ${latencyMs}ms).`,
        };
      } else {
        return {
          success: false,
          latencyMs,
          message: `Servidor retornou erro HTTP ${res?.status || 502}. Verifique a URL e chaves de acesso.`,
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        message: `Falha ao contactar gateway: ${err.message || 'Host inalcançável'}`,
      };
    }
  }

  async createCharge(input: CreateChargeInput, config?: ProviderConfig): Promise<CreateChargeResult> {
    const apiUrl = config?.apiUrl?.trim();
    if (!apiUrl) {
      return {
        success: false,
        status: 'failed',
        errorMessage: 'URL do gateway não configurada.',
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (config?.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['X-API-Key'] = config.apiKey;
      }

      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/charges`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: input.amount,
          currency: 'AOA',
          method: input.method,
          phoneNumber: input.phoneNumber,
          merchantTransactionId: input.merchantTransactionId,
          description: input.description,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          status: 'failed',
          errorMessage: data?.message || data?.error || `Erro HTTP ${res.status}`,
          rawResponse: data,
        };
      }

      return {
        success: true,
        providerChargeId: data.id || data.chargeId || `gen_${Date.now()}`,
        status: data.status || 'pending',
        referenceDetails: data.referenceDetails,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        errorMessage: err.message,
      };
    }
  }

  async checkStatus(chargeIdOrMerchantTxId: string, config?: ProviderConfig): Promise<CheckStatusResult> {
    const apiUrl = config?.apiUrl?.trim();
    if (!apiUrl) {
      return { success: false, status: 'pending', errorMessage: 'URL do gateway não configurada' };
    }

    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (config?.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/charges/${chargeIdOrMerchantTxId}`, { headers });
      const data: any = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        status: data.status || 'pending',
        providerChargeId: data.id,
        rawResponse: data,
      };
    } catch (err: any) {
      return { success: false, status: 'pending', errorMessage: err.message };
    }
  }

  verifyWebhookSignature(signatureHeader: string | undefined, _rawBody: string, secret: string): boolean {
    if (!secret || !signatureHeader) return true;
    return signatureHeader.length > 0;
  }
}
