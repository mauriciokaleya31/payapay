import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Percent, 
  Save, 
  FileText, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface SellersManagementViewProps {
  currentUser: AdminUser;
  onShowToast: (title: string, desc: string) => void;
}

export const SellersManagementView: React.FC<SellersManagementViewProps> = ({
  currentUser,
  onShowToast,
}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Commission editing state per user id: { [userId]: number }
  const [commissionRates, setCommissionRates] = useState<{ [id: string]: number }>({});
  const [savingFeeUserId, setSavingFeeUserId] = useState<string | null>(null);

  // KYC Review Modal state
  const [selectedUserForKyc, setSelectedUserForKyc] = useState<AdminUser | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'verified' | 'rejected'>('verified');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingKycReview, setIsSubmittingKycReview] = useState(false);

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      // Keep vendors/merchants and developers
      setUsers(data);
      // Initialize commission rates
      const ratesMap: { [id: string]: number } = {};
      data.forEach((u) => {
        ratesMap[u.id] = u.platformFeePercentage ?? 10;
      });
      setCommissionRates(ratesMap);
    } catch (err: any) {
      onShowToast('Erro ao carregar vendedores', err.message || 'Falha na requisição');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  // Filter sellers
  const sellers = users.filter((u) => {
    const isVendor = u.role === 'merchant' || u.role === 'developer';
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesKyc = kycFilter === 'all' ? true : (u.kycStatus || 'pending') === kycFilter;
    return isVendor && matchesSearch && matchesKyc;
  });

  // Calculate stats
  const totalVolume = sellers.reduce((acc, curr) => acc + (curr.totalSalesVolume || 0), 0);
  const totalSalesCount = sellers.reduce((acc, curr) => acc + (curr.totalSalesCount || 0), 0);
  const pendingKycCount = sellers.filter((u) => (u.kycStatus || 'pending') === 'pending').length;
  const verifiedCount = sellers.filter((u) => u.kycStatus === 'verified').length;

  // Save Commission Rate
  const handleSaveCommissionRate = async (seller: AdminUser) => {
    const rate = commissionRates[seller.id];
    if (rate === undefined || rate < 0 || rate > 50) {
      onShowToast('Taxa Inválida', 'A comissão deve ser um valor entre 0% e 50%.');
      return;
    }

    setSavingFeeUserId(seller.id);
    try {
      await api.updateUser(seller.id, { platformFeePercentage: Number(rate) });
      onShowToast('Comissão Atualizada', `Taxa do vendedor ${seller.name} alterada para ${rate}%.`);
      loadSellers();
    } catch (err: any) {
      onShowToast('Erro ao atualizar taxa', err.message || 'Falha ao guardar comissão');
    } finally {
      setSavingFeeUserId(null);
    }
  };

  // Open KYC Review Modal
  const handleOpenKycReview = (seller: AdminUser) => {
    setSelectedUserForKyc(seller);
    setReviewStatus(seller.kycStatus === 'rejected' ? 'rejected' : 'verified');
    setReviewNotes(seller.kycNotes || '');
  };

  // Submit KYC Review
  const handleSubmitKycReview = async () => {
    if (!selectedUserForKyc) return;
    setIsSubmittingKycReview(true);
    try {
      await api.updateUser(selectedUserForKyc.id, {
        kycStatus: reviewStatus,
        kycNotes: reviewNotes.trim() || undefined,
      });
      onShowToast(
        'KYC Atualizado',
        `Vendedor ${selectedUserForKyc.name} agora está como "${
          reviewStatus === 'verified' ? 'Verificado' : reviewStatus === 'rejected' ? 'Rejeitado' : 'Pendente'
        }".`
      );
      setSelectedUserForKyc(null);
      loadSellers();
    } catch (err: any) {
      onShowToast('Erro na verificação', err.message || 'Falha ao gravar status KYC');
    } finally {
      setIsSubmittingKycReview(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (seller: AdminUser) => {
    const newStatus = seller.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUser(seller.id, { status: newStatus });
      onShowToast(
        'Estado Alterado',
        `A conta do vendedor foi marcada como ${newStatus === 'active' ? 'Ativa' : 'Suspensa'}.`
      );
      loadSellers();
    } catch (err: any) {
      onShowToast('Erro ao atualizar status', err.message || 'Falha ao alterar estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Gestão de Vendedores & Infoprodutores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervisão de criadores de infoprodutos, verificação de conformidade KYC e gestão personalizada de comissões.
          </p>
        </div>

        <button
          onClick={loadSellers}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Vendedores</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{sellers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Criadores de conteúdos ativos</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">KYC Pendente</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{pendingKycCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">{verifiedCount} já verificados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Volume Total</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{formatKz(totalVolume)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Faturado em vendas digitais</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vendas Liquidadas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalSalesCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Transações aprovadas</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email ou loja..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">KYC:</span>
          <div className="flex gap-1.5">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKycFilter(k)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  kycFilter === k
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {k === 'all' ? 'Todos' : k === 'pending' ? 'Pendente' : k === 'verified' ? 'Verificado' : 'Rejeitado'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Vendedor / Loja</th>
                <th className="py-3.5 px-4">Conformidade KYC</th>
                <th className="py-3.5 px-4">Produtos & Links</th>
                <th className="py-3.5 px-4">Vendas Realizadas</th>
                <th className="py-3.5 px-4">Comissão da Plataforma</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum vendedor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => {
                  const kyc = seller.kycStatus || 'pending';
                  const currentRate = commissionRates[seller.id] ?? (seller.platformFeePercentage || 10);

                  return (
                    <tr key={seller.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{seller.name}</div>
                        <div className="text-[11px] text-slate-400">{seller.email}</div>
                        {seller.companyName && (
                          <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                            Loja: {seller.companyName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              kyc === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : kyc === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {kyc === 'verified' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : kyc === 'rejected' ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {kyc === 'verified' ? 'Verificado' : kyc === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </span>

                          <button
                            onClick={() => handleOpenKycReview(seller)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Rever / Alterar Status KYC"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {seller.kycNotes && (
                          <p className="text-[10px] text-slate-500 mt-1 truncate max-w-xs">{seller.kycNotes}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-white font-semibold">
                          {seller.productsCount ?? 0} Produtos
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {seller.linksCount ?? 0} Links de Pagamento
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-emerald-400">
                          {formatKz(seller.totalSalesVolume || 0)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {seller.totalSalesCount || 0} compras concluídas
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="relative w-20">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.5"
                              value={currentRate}
                              onChange={(e) =>
                                setCommissionRates({
                                  ...commissionRates,
                                  [seller.id]: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="absolute right-2 top-1 text-slate-500 text-[11px]">%</span>
                          </div>

                          <button
                            onClick={() => handleSaveCommissionRate(seller)}
                            disabled={savingFeeUserId === seller.id || currentRate === seller.platformFeePercentage}
                            className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 transition-all"
                            title="Salvar Taxa de Comissão"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Padrão: 10% &bull; Retido por venda
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(seller)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            seller.status === 'active'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {seller.status === 'active' ? 'Suspender' : 'Ativar'}
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

      {/* KYC Review Modal */}
      {selectedUserForKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Revisão de Conformidade KYC</h3>
              </div>
              <button
                onClick={() => setSelectedUserForKyc(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <p><strong className="text-white">Vendedor:</strong> {selectedUserForKyc.name}</p>
              <p><strong className="text-white">E-mail:</strong> {selectedUserForKyc.email}</p>
              <p><strong className="text-white">Loja / Empresa:</strong> {selectedUserForKyc.companyName || 'Não informado'}</p>
              <p><strong className="text-white">Telemóvel:</strong> {selectedUserForKyc.phone || 'Não informado'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Decisão do Administrador
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('verified')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                    reviewStatus === 'verified'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('pending')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                    reviewStatus === 'pending'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('rejected')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                    reviewStatus === 'rejected'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Rejeitar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Notas do Administrador / Motivo
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Ex: Documento de identidade BI e NIF validados com sucesso."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUserForKyc(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitKycReview}
                disabled={isSubmittingKycReview}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingKycReview ? 'A guardar...' : 'Confirmar Decisão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
