import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Activity, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  FileText, 
  Clock, 
  Smartphone, 
  CreditCard,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ProviderConfig, PaymentMethodType, AuditLog } from '../types';

interface AdminProvidersViewProps {
  providers: ProviderConfig[];
  logs: AuditLog[];
  onUpdateProvider: (id: string, payload: Partial<ProviderConfig>) => Promise<void>;
  onTestConnection: (id: string) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  onRefreshLogs: () => void;
}

export const AdminProvidersView: React.FC<AdminProvidersViewProps> = ({
  providers,
  logs,
  onUpdateProvider,
  onTestConnection,
  onRefreshLogs,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'providers' | 'logs'>('providers');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('nuvex');
  const [editConfigs, setEditConfigs] = useState<Record<string, Partial<ProviderConfig>>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  const getEditValue = <K extends keyof ProviderConfig>(id: string, key: K): any => {
    if (editConfigs[id] && editConfigs[id][key] !== undefined) {
      return editConfigs[id][key];
    }
    const orig = providers.find((p) => p.id === id);
    return orig ? orig[key] : '';
  };

  const handleFieldChange = (id: string, field: keyof ProviderConfig, value: any) => {
    setEditConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const toggleMethod = (providerId: string, method: PaymentMethodType) => {
    const currentMethods: PaymentMethodType[] = getEditValue(providerId, 'supportedMethods') || [];
    let updated: PaymentMethodType[];
    if (currentMethods.includes(method)) {
      if (currentMethods.length === 1) return;
      updated = currentMethods.filter((m) => m !== method);
    } else {
      updated = [...currentMethods, method];
    }
    handleFieldChange(providerId, 'supportedMethods', updated);
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    try {
      const changes = editConfigs[id] || {};
      await onUpdateProvider(id, changes);
    } finally {
      setSavingId(null);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await onTestConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: res }));
    } finally {
      setTestingId(null);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.type === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Painel Administrativo</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Provedores & Auditoria</h2>
          <p className="text-xs text-slate-500">
            Arquitectura Multi-Provider: configure credenciais Nuvex, métodos de pagamento e consulte logs de erros.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveSubTab('providers')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'providers'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Provedores de Pagamento</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Logs & Erros ({logs.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'providers' ? (
        <div className="space-y-6">
          {/* Architecture Visual Diagram Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Arquitectura de Roteamento Multi-Provedor
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs">
                Cliente / Aplicação
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-mono text-slate-200">
                Gateway Engine
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg font-bold">
                Nuvex Pagamentos (Ativo)
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
                <span>GPO (MCX Express)</span>
                <span>•</span>
                <span>GPR (Referência)</span>
              </div>
            </div>
          </div>

          {/* Providers List & Configuration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Providers Selector Sidebar */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulos Instalados</h3>
              {providers.map((p) => {
                const isSelected = selectedProviderId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProviderId(p.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center space-x-1.5 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Métodos:</span>
                      {p.supportedMethods.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Provider Configuration Editor Form */}
            {selectedProvider && (
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedProvider.name}</h3>
                      {selectedProvider.isDefault && (
                        <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{selectedProvider.description}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(selectedProvider.id, 'testMode', true)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          getEditValue(selectedProvider.id, 'testMode')
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Sandbox / Testes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(selectedProvider.id, 'testMode', false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          !getEditValue(selectedProvider.id, 'testMode')
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Produção / Live
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleFieldChange(selectedProvider.id, 'isActive', !getEditValue(selectedProvider.id, 'isActive'))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        getEditValue(selectedProvider.id, 'isActive')
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {getEditValue(selectedProvider.id, 'isActive') ? 'Activado' : 'Desactivado'}
                    </button>
                  </div>
                </div>

                {/* Status Mode Banner */}
                {getEditValue(selectedProvider.id, 'testMode') ? (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                    <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px] bg-blue-100 px-1.5 py-0.5 rounded">
                      Modo Sandbox
                    </span>
                    <span className="text-blue-800">
                      Simulação activa para Multicaixa Express e Referências. Nenhuma chamada de produção será emitida sem que uma chave Live real seja configurada.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                    <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">
                      Modo Produção
                    </span>
                    <span className="text-amber-800">
                      As cobranças serão enviadas diretamente para o endpoint oficial Nuvex utilizando a API Key e Webhook Secret abaixo.
                    </span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4 text-xs">
                  {/* API URL */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">API Base URL</label>
                    <input
                      type="url"
                      value={getEditValue(selectedProvider.id, 'apiUrl')}
                      onChange={(e) => handleFieldChange(selectedProvider.id, 'apiUrl', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">API Key do Provedor (ex: nvx_live_...)</label>
                    <div className="relative">
                      <input
                        type={showKeys[`${selectedProvider.id}_key`] ? 'text' : 'password'}
                        value={getEditValue(selectedProvider.id, 'apiKey')}
                        onChange={(e) => handleFieldChange(selectedProvider.id, 'apiKey', e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            [`${selectedProvider.id}_key`]: !prev[`${selectedProvider.id}_key`],
                          }))
                        }
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-700"
                      >
                        {showKeys[`${selectedProvider.id}_key`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Webhook Secret */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Webhook Secret (ex: whsec_...)</label>
                    <div className="relative">
                      <input
                        type={showKeys[`${selectedProvider.id}_secret`] ? 'text' : 'password'}
                        value={getEditValue(selectedProvider.id, 'webhookSecret')}
                        onChange={(e) => handleFieldChange(selectedProvider.id, 'webhookSecret', e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            [`${selectedProvider.id}_secret`]: !prev[`${selectedProvider.id}_secret`],
                          }))
                        }
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-700"
                      >
                        {showKeys[`${selectedProvider.id}_secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Payment Methods Checkboxes */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-2">Métodos de Pagamento Suportados</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => toggleMethod(selectedProvider.id, 'GPO')}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          (getEditValue(selectedProvider.id, 'supportedMethods') || []).includes('GPO')
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span>Multicaixa Express (GPO)</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">Push Mobile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleMethod(selectedProvider.id, 'GPR')}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                          (getEditValue(selectedProvider.id, 'supportedMethods') || []).includes('GPR')
                            ? 'bg-slate-900 border-slate-900 text-white font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Referência Bancária (GPR)</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">ATM / IB</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Connection Test Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Diagnóstico de Conexão</span>
                    <button
                      type="button"
                      onClick={() => handleTest(selectedProvider.id)}
                      disabled={testingId === selectedProvider.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Wifi className={`w-3.5 h-3.5 ${testingId === selectedProvider.id ? 'animate-pulse text-blue-600' : ''}`} />
                      <span>{testingId === selectedProvider.id ? 'Testando...' : 'Testar Conexão com API'}</span>
                    </button>
                  </div>

                  {testResults[selectedProvider.id] && (
                    <div
                      className={`text-xs p-2.5 rounded-lg border flex items-start space-x-2 ${
                        testResults[selectedProvider.id].success
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border-rose-200'
                      }`}
                    >
                      {testResults[selectedProvider.id].success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold">{testResults[selectedProvider.id].message}</div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          Latência: {testResults[selectedProvider.id].latencyMs}ms
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Footer */}
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSave(selectedProvider.id)}
                    disabled={savingId === selectedProvider.id}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingId === selectedProvider.id ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Logs Sub-tab */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Logs de Auditoria & Webhooks</h3>
              <p className="text-xs text-slate-500">Histórico de requisições, callbacks Nuvex e entregas aos clientes</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="all">Todos os Logs</option>
                <option value="webhook_received">Callbacks Nuvex</option>
                <option value="webhook_dispatched">Webhooks Clientes</option>
                <option value="api_request">Requisições API</option>
                <option value="system_error">Erros</option>
              </select>

              <button
                onClick={onRefreshLogs}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Recarregar logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Nenhum log registado para este filtro.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.success ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="font-bold text-slate-900">{log.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {log.endpoint || log.type}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString('pt-PT')}
                    </span>
                  </div>

                  {log.details && <p className="text-slate-600 pl-4">{log.details}</p>}

                  {log.payload && (
                    <div className="pl-4 pt-1">
                      <pre className="bg-slate-950 text-slate-300 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-24">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
