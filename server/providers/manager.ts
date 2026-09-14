import { PaymentProvider } from './base.js';
import { NuvexProvider } from './nuvex.js';
import { GenericGatewayProvider } from './generic.js';
import { ProviderConfig, PaymentMethodType } from '../types.js';

export class ProviderManager {
  private providers: Map<string, PaymentProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    // Register initial Nuvex provider
    const nuvex = new NuvexProvider();
    this.registerProvider(nuvex);

    // Register generic provider for EMIS
    this.registerProvider(new GenericGatewayProvider('emis', 'EMIS Direto'));

    // Set default initial config for Nuvex
    const hasLiveEnvKey = Boolean(
      process.env.NUVEX_API_KEY &&
      process.env.NUVEX_API_KEY.startsWith('nvx_live_') &&
      !process.env.NUVEX_API_KEY.includes('demo') &&
      !process.env.NUVEX_API_KEY.includes('test') &&
      !process.env.NUVEX_API_KEY.includes('your_api_key') &&
      process.env.NUVEX_API_KEY.length > 20
    );

    const defaultConfig: ProviderConfig = {
      id: 'nuvex',
      name: 'Nuvex Pagamentos',
      description: 'Gateway angolano especializado em Multicaixa Express (GPO) e Referências de Pagamento (GPR).',
      isActive: true,
      isDefault: true,
      apiUrl: process.env.NUVEX_API_URL || 'https://pagamentos-nuvex.lovable.app',
      apiKey: hasLiveEnvKey ? (process.env.NUVEX_API_KEY as string) : '',
      secretKey: hasLiveEnvKey ? (process.env.NUVEX_API_KEY as string) : '',
      webhookSecret: process.env.NUVEX_WEBHOOK_SECRET || 'whsec_gateway_9941_real',
      supportedMethods: ['GPO', 'GPR'],
      testMode: !hasLiveEnvKey,
    };
    this.configs.set('nuvex', defaultConfig);

    // Register a template slot for next-gen provider (e.g. EMIS / Multicaixa Direct)
    const futureConfig: ProviderConfig = {
      id: 'emis',
      name: 'EMIS Direto (Módulo Futuro)',
      description: 'Conector nativo para rede EMIS Multicaixa e transferências instantâneas Kwanza.',
      isActive: false,
      isDefault: false,
      apiUrl: 'https://api.emis.co.ao/v2',
      apiKey: '',
      secretKey: '',
      webhookSecret: '',
      supportedMethods: ['GPO', 'GPR'],
      testMode: true,
    };
    this.configs.set('emis', futureConfig);
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): PaymentProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }

  getConfig(providerId: string): ProviderConfig | undefined {
    return this.configs.get(providerId);
  }

  updateConfig(providerId: string, updates: Partial<ProviderConfig>): ProviderConfig {
    const current = this.configs.get(providerId);
    if (!current) {
      throw new Error(`Provider config not found for: ${providerId}`);
    }

    const updated = {
      ...current,
      ...updates,
    };
    this.configs.set(providerId, updated);
    return updated;
  }

  /**
   * Resolves the primary active provider for a given method
   */
  resolveProviderForMethod(method: PaymentMethodType): { provider: PaymentProvider; config: ProviderConfig } {
    for (const [id, config] of this.configs.entries()) {
      if (config.isActive && config.supportedMethods.includes(method)) {
        const provider = this.providers.get(id);
        if (provider) {
          return { provider, config };
        }
      }
    }

    // Default fallback to Nuvex if none explicitly matches
    const nuvexProvider = this.providers.get('nuvex')!;
    const nuvexConfig = this.configs.get('nuvex')!;
    return { provider: nuvexProvider, config: nuvexConfig };
  }

  async testProviderConnection(
    providerId: string,
    overrideConfig?: Partial<ProviderConfig>
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const provider = this.providers.get(providerId);
    const currentConfig = this.configs.get(providerId);

    if (!provider || !currentConfig) {
      return {
        success: false,
        latencyMs: 0,
        message: `Provedor ${providerId} não está instalado no sistema.`,
      };
    }

    const effectiveConfig: ProviderConfig = {
      ...currentConfig,
      ...(overrideConfig || {}),
    };

    const result = await provider.testConnection(effectiveConfig);
    effectiveConfig.lastConnectionTest = {
      timestamp: new Date().toISOString(),
      success: result.success,
      latencyMs: result.latencyMs,
      message: result.message,
    };
    this.configs.set(providerId, effectiveConfig);
    return result;
  }

  addOrUpdateCustomProvider(config: ProviderConfig): ProviderConfig {
    this.configs.set(config.id, config);
    if (!this.providers.has(config.id)) {
      this.providers.set(config.id, new GenericGatewayProvider(config.id, config.name));
    }
    return config;
  }

  deleteProvider(providerId: string): boolean {
    if (providerId === 'nuvex') {
      throw new Error('O gateway Nuvex é a infraestrutura padrão do sistema e não pode ser apagado.');
    }
    this.providers.delete(providerId);
    return this.configs.delete(providerId);
  }
}

export const providerManager = new ProviderManager();
