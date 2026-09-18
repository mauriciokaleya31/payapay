import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  FileText, 
  Download, 
  User, 
  Key, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  LogOut, 
  Smartphone, 
  CreditCard, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  Copy, 
  Check, 
  ArrowLeft,
  QrCode,
  Building,
  HelpCircle,
  Eye
} from 'lucide-react';
import { AdminUser, Charge } from '../types';
import { api } from '../services/api';

interface CustomerDashboardViewProps {
  customerUser: AdminUser;
  onLogout: () => void;
  onBackToStore?: () => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  customerUser,
  onLogout,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'invoices' | 'downloads' | 'security'>('purchases');
  const [purchases, setPurchases] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceCharge, setSelectedInvoiceCharge] = useState<Charge | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, [customerUser.email]);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomerPurchases(customerUser.email);
      setPurchases(data || []);
    } catch (err) {
      console.warn('Erro ao carregar compras:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'A confirmação da palavra-passe não coincide.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.updateProfile({
        currentPassword,
        newPassword,
      });
      setSecurityMessage({ type: 'success', text: 'Palavra-passe atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err.message || 'Erro ao alterar palavra-passe.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const paidPurchases = purchases.filter((p) => p.status === 'paid');
  const totalSpent = paidPurchases.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredPurchases = purchases.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.merchantTransactionId.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.method && p.method.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Área de Clientes
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Portal Seguro
                </span>
              </span>
              <p className="text-xs text-slate-400">Histórico de Compras, Faturas e Downloads</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à Loja</span>
              </button>
            )}

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">{customerUser.name || 'Cliente'}</span>
              <span className="text-[11px] text-slate-400">{customerUser.email}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-850 p-6 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-1">
                Bem-vindo ao seu portal
              </span>
              <h2 className="text-2xl font-black text-white">
                Olá, {customerUser.name || customerUser.email.split('@')[0]}!
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Aqui tem acesso instantâneo a todos os comprovativos de pagamento, faturas legais e arquivos para descarregar referentes às suas compras.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autenticado com segurança via Nuvex Gateway Angola</span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Investido</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">{formatKz(totalSpent)}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{paidPurchases.length} compras concluídas</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Faturas & Recibos</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">{paidPurchases.length}</div>
              <div className="text-[11px] text-blue-300 mt-0.5">Prontas para descarregar em PDF</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'purchases'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Minhas Compras ({purchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Faturas & Recibos Oficiais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'downloads'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Arquivos Digitais Comprados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Segurança da Conta</span>
          </button>
        </div>

        {/* Tab 1: Purchases List */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por transação ou item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                A exibir <strong>{filteredPurchases.length}</strong> de {purchases.length} transações
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-850 rounded-2xl border border-slate-800">
                <Clock className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-2" />
                <p className="text-xs">A carregar o seu histórico de pagamentos...</p>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="p-12 text-center bg-slate-850 rounded-2xl border border-slate-800 space-y-3">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                <h3 className="text-base font-bold text-white">Nenhuma compra registada</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Ainda não realizou compras com este endereço de e-mail ({customerUser.email}).
                </p>
                {onBackToStore && (
                  <button
                    type="button"
                    onClick={onBackToStore}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Explorar Produtos na Loja
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Detalhes da Compra</th>
                        <th className="px-5 py-3.5">Método</th>
                        <th className="px-5 py-3.5">Montante</th>
                        <th className="px-5 py-3.5">Data</th>
                        <th className="px-5 py-3.5">Estado</th>
                        <th className="px-5 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredPurchases.map((charge) => {
                        const isPayed = charge.status === 'paid';
                        return (
                          <tr key={charge.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-white text-sm">
                                {charge.description || 'Produto Nuvex'}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 mt-0.5">
                                <span>Ref: {charge.merchantTransactionId}</span>
                                <button
                                  type="button"
                                  onClick={() => copyText(charge.merchantTransactionId, charge.id)}
                                  className="text-slate-500 hover:text-slate-300"
                                  title="Copiar referência"
                                >
                                  {copiedId === charge.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                                {charge.method === 'GPO' ? (
                                  <>
                                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Multicaixa Express</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Referência ATM</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-bold text-white text-sm">
                                {formatKz(charge.amount)}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-slate-400">
                              {new Date(charge.createdAt).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            <td className="px-5 py-4">
                              {isPayed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Pago</span>
                                </span>
                              ) : charge.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Pendente</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>Falhou</span>
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceCharge(charge)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                <span>Ver Fatura</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Official Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Emissão de Faturas e Recibos Fiscais</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Todas as faturas emitidas pela plataforma cumprem as normas de faturação de Angola (AGT), incluindo identificador único de liquidação, data fiscal e dados para contabilidade empresarial.
              </p>
            </div>

            {paidPurchases.length === 0 ? (
              <div className="p-8 text-center bg-slate-850 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Ainda não tem pagamentos confirmados para gerar faturas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-850 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">
                          FATURA-RECIBO
                        </span>
                        <span className="text-[11px] font-bold text-emerald-450 text-emerald-400">
                          LIQUIDADA
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {p.description || 'Aquisição de Produto'}
                        </h4>
                        <p className="text-xs font-mono text-slate-400">Nº FAT-{p.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total Liquidado:</span>
                          <span className="font-bold text-white text-sm">{formatKz(p.amount)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Data de Emissão:</span>
                          <span className="text-slate-300 text-xs">
                            {new Date(p.paidAt || p.createdAt).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceCharge(p)}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Visualizar e Imprimir Fatura</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Downloads */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                <span>Seus Arquivos e Conteúdos Digitais</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Descarregue os arquivos, pacotes digitais, softwares ou acessos adquiridos com a sua conta. Todos os ficheiros são verificados e estão sempre disponíveis nesta área.
              </p>
            </div>

            {paidPurchases.length === 0 ? (
              <div className="p-8 text-center bg-slate-850 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Nenhum arquivo digital disponível para descarregar.
              </div>
            ) : (
              <div className="space-y-3">
                {paidPurchases.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <Download className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.description || 'Pacote Digital Licenciado'}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>Licença: <strong>{item.merchantTransactionId}</strong></span>
                          <span>•</span>
                          <span>Comprado em {new Date(item.paidAt || item.createdAt).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([
                            `RECIBO E LICENÇA DIGITAL NUVEX ANGOLA\n\nItem: ${item.description}\nTransação: ${item.merchantTransactionId}\nComprador: ${customerUser.name} (${customerUser.email})\nData: ${item.paidAt || item.createdAt}\nMontante: ${formatKz(item.amount)}\nEstado: LIQUIDADO\nChave de Acesso Única: ${item.id}\n`
                          ], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `comprovativo_${item.merchantTransactionId}.txt`;
                          a.click();
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descarregar Arquivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceCharge(item)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
                        title="Ver fatura"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Account & Security */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  <span>Definições de Acesso e Palavra-passe</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pode alterar a palavra-passe temporária gerada automaticamente durante a sua compra por uma palavra-passe pessoal e memorável.
                </p>
              </div>

              {securityMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    securityMessage.type === 'success'
                      ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/50 border border-rose-800/60 text-rose-300'
                  }`}
                >
                  {securityMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Palavra-passe Atual (ou temporária recebida na compra) *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nova Palavra-passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirmar Nova Palavra-passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova palavra-passe"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isUpdatingPassword ? 'A atualizar...' : 'Salvar Nova Palavra-passe'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Official Printable Invoice Modal */}
      {selectedInvoiceCharge && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                    N
                  </div>
                  <span className="text-xl font-black text-slate-900">Nuvex Gateway Angola</span>
                </div>
                <p className="text-xs text-slate-500">
                  Sistema Integrado de Pagamentos Interbancários • Luanda, Angola
                </p>
                <p className="text-[11px] text-slate-400">NIF Contribuinte: 5418920491</p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                  FATURA - RECIBO
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                  Nº FR-{selectedInvoiceCharge.id.slice(0, 8).toUpperCase()}/2026
                </div>
                <div className="text-[11px] text-slate-500">
                  Data: {new Date(selectedInvoiceCharge.paidAt || selectedInvoiceCharge.createdAt).toLocaleDateString('pt-PT')}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Emitente:</span>
                <div className="font-bold text-slate-900">Pay Yetux & Nuvex Pagamentos Lda</div>
                <div className="text-slate-600">Luanda, República de Angola</div>
                <div className="text-slate-600">suporte@nuvex.ao</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Adquirente / Cliente:</span>
                <div className="font-bold text-slate-900">{customerUser.name || 'Consumidor Final'}</div>
                <div className="text-slate-600">{customerUser.email}</div>
                {customerUser.phone && <div className="text-slate-600">+244 {customerUser.phone}</div>}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Descrição</th>
                    <th className="px-4 py-2.5 text-center">Qtd</th>
                    <th className="px-4 py-2.5 text-right">Preço Unitário</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {selectedInvoiceCharge.description || 'Produto ou Serviço Licenciado'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Ref. Transação: {selectedInvoiceCharge.merchantTransactionId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">1</td>
                    <td className="px-4 py-3 text-right">{formatKz(selectedInvoiceCharge.amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatKz(selectedInvoiceCharge.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-between items-start pt-2">
              <div className="space-y-1 text-xs text-slate-500 max-w-xs">
                <p className="font-semibold text-slate-700">Observações Legais:</p>
                <p className="text-[10px] leading-relaxed">
                  Imposto sobre o Valor Acrescentado (IVA): Regime Geral / Isenção legal aplicável.
                  Documento emitido nos termos do Decreto Presidencial sobre Faturação Eletrónica em Angola.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Liquidado por {selectedInvoiceCharge.method === 'GPO' ? 'Multicaixa Express' : 'Referência Bancária'}</span>
                </div>
              </div>

              <div className="w-48 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatKz(selectedInvoiceCharge.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA (14% / Isento):</span>
                  <span>0 Kz</span>
                </div>
                <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Pago:</span>
                  <span>{formatKz(selectedInvoiceCharge.amount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInvoiceCharge(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Fatura / Salvar em PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
