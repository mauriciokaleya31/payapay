import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Smartphone, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Charge, ClientApp } from '../types';

interface TransactionsViewProps {
  charges: Charge[];
  apps: ClientApp[];
  onSyncCharge: (id: string) => Promise<void>;
  onSimulatePay: (id: string) => Promise<void>;
  selectedCharge: Charge | null;
  setSelectedCharge: (charge: Charge | null) => void;
  onRefresh: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  charges,
  apps,
  onSyncCharge,
  onSimulatePay,
  selectedCharge,
  setSelectedCharge,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredCharges = charges.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (methodFilter !== 'all' && c.method !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchTx = c.merchantTransactionId.toLowerCase().includes(q);
      const matchCustomer = (c.customerName && c.customerName.toLowerCase().includes(q)) || false;
      const matchEmail = (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) || false;
      const matchPhone = (c.phoneNumber && c.phoneNumber.includes(q)) || false;
      const matchDesc = (c.description && c.description.toLowerCase().includes(q)) || false;
      if (!matchId && !matchTx && !matchCustomer && !matchEmail && !matchPhone && !matchDesc) {
        return false;
      }
    }
    return true;
  });

  const handleSync = async (id: string) => {
    setIsSyncing(true);
    try {
      await onSyncCharge(id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulate = async (id: string) => {
    setIsSimulating(true);
    try {
      await onSimulatePay(id);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transacções e Pagamentos</h2>
          <p className="text-xs text-slate-500">Histórico de cobranças com consulta direta e webhook logs</p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por ID, referência, cliente, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Todos os Estados</option>
            <option value="paid">Pago (Aprovado)</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Todos os Métodos</option>
            <option value="GPO">Multicaixa Express (GPO)</option>
            <option value="GPR">Referência Bancária (GPR)</option>
          </select>

          <span className="text-xs text-slate-400 font-medium px-1">
            {filteredCharges.length} {filteredCharges.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Referência / Merchant ID</th>
                <th className="py-3 px-4">Cliente / Contacto</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Montante</th>
                <th className="py-3 px-4">Provedor</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Criado em</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma transacção encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCharges.map((charge) => {
                  const isGPO = charge.method === 'GPO';
                  return (
                    <tr
                      key={charge.id}
                      onClick={() => setSelectedCharge(charge)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {charge.merchantTransactionId}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{charge.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-900">
                          {charge.customerName || 'Cliente Direto'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {charge.phoneNumber || charge.customerEmail || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isGPO 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}>
                          {isGPO ? (
                            <>
                              <Smartphone className="w-3 h-3 mr-1" />
                              MCX Express
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3 mr-1" />
                              Referência
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatKz(charge.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                          Nuvex
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          charge.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : charge.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {charge.status === 'paid' && '● Pago'}
                          {charge.status === 'pending' && '● Pendente'}
                          {charge.status === 'failed' && '● Falhado'}
                          {charge.status === 'cancelled' && '● Cancelado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(charge.createdAt).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCharge(charge);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Inspection Drawer / Modal */}
      {selectedCharge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                    {selectedCharge.merchantTransactionId}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedCharge.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedCharge.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedCharge.status === 'paid' && 'Pago'}
                    {selectedCharge.status === 'pending' && 'Pendente'}
                    {selectedCharge.status === 'failed' && 'Falhado'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Detalhes da Transacção
                </h3>
              </div>
              <button
                onClick={() => setSelectedCharge(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Main Amount & Method Card */}
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-200 font-medium">Montante da Cobrança</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    Provedor: Nuvex
                  </span>
                </div>
                <div className="text-3xl font-black mt-1 text-white tracking-tight">
                  {formatKz(selectedCharge.amount)}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-800/60 flex items-center justify-between text-xs text-blue-200">
                  <span>Método: <strong>{selectedCharge.method === 'GPO' ? 'Multicaixa Express (GPO)' : 'Referência Bancária (GPR)'}</strong></span>
                  <span>Ambiente: <strong className="uppercase">{selectedCharge.environment}</strong></span>
                </div>
              </div>

              {/* Reference Details if GPR */}
              {selectedCharge.method === 'GPR' && selectedCharge.referenceDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Dados de Pagamento (Multicaixa / ATM / Internet Banking)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-500">Entidade</div>
                      <div className="font-mono text-base font-bold text-slate-900">
                        {selectedCharge.referenceDetails.entity}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-500">Referência</div>
                      <div className="font-mono text-base font-bold text-blue-700">
                        {selectedCharge.referenceDetails.reference}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                      <div className="text-xs text-slate-500">Validade</div>
                      <div className="text-xs font-semibold text-slate-800">
                        {new Date(selectedCharge.referenceDetails.expiryDate).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Multicaixa Express Phone if GPO */}
              {selectedCharge.method === 'GPO' && selectedCharge.phoneNumber && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">Número Multicaixa Express Notificado</div>
                    <div className="text-base font-mono font-bold text-slate-900">
                      +244 {selectedCharge.phoneNumber}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Technical Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-700">Cliente</div>
                  <div>Nome: <span className="font-semibold text-slate-900">{selectedCharge.customerName || 'Não informado'}</span></div>
                  <div>Email: <span className="font-semibold text-slate-900">{selectedCharge.customerEmail || 'Não informado'}</span></div>
                  <div>Aplicação: <span className="font-semibold text-slate-900">{selectedCharge.appName || 'Checkout Gateway'}</span></div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-700">Identificadores Técnicos</div>
                  <div>Gateway ID: <span className="font-mono text-slate-900">{selectedCharge.id}</span></div>
                  <div>Nuvex ID: <span className="font-mono text-slate-900">{selectedCharge.providerChargeId || '—'}</span></div>
                  <div>Criado em: <span className="text-slate-900">{new Date(selectedCharge.createdAt).toLocaleString('pt-PT')}</span></div>
                  {selectedCharge.paidAt && (
                    <div>Pago em: <span className="text-emerald-700 font-semibold">{new Date(selectedCharge.paidAt).toLocaleString('pt-PT')}</span></div>
                  )}
                </div>
              </div>

              {/* Raw Response toggle/view */}
              {selectedCharge.providerRawResponse && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-600">Resposta Bruta do Nuvex API:</div>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedCharge.providerRawResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {selectedCharge.status === 'pending' && (
                  <button
                    onClick={() => handleSimulate(selectedCharge.id)}
                    disabled={isSimulating}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSimulating ? 'Confirmando...' : 'Simular Pagamento (Aprovar)'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleSync(selectedCharge.id)}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Nuvex</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedCharge(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
