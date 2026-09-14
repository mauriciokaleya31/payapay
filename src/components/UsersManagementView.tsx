import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Code, 
  CheckCircle2, 
  XCircle, 
  MoreVertical, 
  Percent, 
  Key, 
  Smartphone, 
  Building, 
  Mail, 
  Trash2, 
  Edit, 
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers,
  AlertCircle
} from 'lucide-react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface UsersManagementViewProps {
  currentUser: AdminUser;
}

export function UsersManagementView({ currentUser }: UsersManagementViewProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'developer' | 'admin'>('all');
  
  // Modal State for adding/editing user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'developer' | 'admin'>('developer');
  const [formPhone, setFormPhone] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formFeePercentage, setFormFeePercentage] = useState<number>(20);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err: any) {
      console.error('Erro ao carregar utilizadores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('developer');
    setFormPhone('');
    setFormCompanyName('');
    setFormFeePercentage(20);
    setFormStatus('active');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    setModalMode('edit');
    setSelectedUser(u);
    setFormName(u.name || '');
    setFormEmail(u.email || '');
    setFormPassword('');
    setFormRole(u.role === 'super_admin' ? 'admin' : (u.role as 'developer' | 'admin'));
    setFormPhone(u.phone || '');
    setFormCompanyName(u.companyName || '');
    setFormFeePercentage(u.platformFeePercentage !== undefined ? u.platformFeePercentage : 20);
    setFormStatus(u.status || 'active');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (u.role === 'super_admin') {
      alert('Não é possível eliminar o Super Administrador da plataforma.');
      return;
    }
    if (u.id === currentUser.id) {
      alert('Não pode eliminar a sua própria conta ativa.');
      return;
    }
    if (!window.confirm(`Tem a certeza que pretende eliminar o utilizador ${u.name} (${u.email})? Esta ação não pode ser revertida.`)) {
      return;
    }

    try {
      await api.deleteUser(u.id);
      setUsers(users.filter((item) => item.id !== u.id));
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar utilizador.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (modalMode === 'create' && !formPassword) {
      setFormError('A palavra-passe é obrigatória para criar um novo utilizador.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await api.createUser({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          phone: formPhone.trim() || undefined,
          companyName: formCompanyName.trim() || undefined,
          platformFeePercentage: formFeePercentage,
        });
        setFormSuccess(res.message || 'Utilizador criado com sucesso!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchUsers();
        }, 1000);
      } else if (selectedUser) {
        const payload: any = {
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          companyName: formCompanyName.trim() || undefined,
          role: formRole,
          status: formStatus,
          platformFeePercentage: formFeePercentage,
        };
        if (formPassword) {
          payload.newPassword = formPassword;
        }
        const res = await api.updateUser(selectedUser.id, payload);
        setFormSuccess(res.message || 'Utilizador atualizado com sucesso!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchUsers();
        }, 1000);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao processar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics calculation
  const totalUsers = users.length;
  const developersCount = users.filter((u) => u.role === 'developer').length;
  const activeDevsWithApps = users.filter((u) => (u.totalApps || 0) > 0).length;
  const totalGrossVolume = users.reduce((sum, u) => sum + (u.totalGrossVolume || 0), 0);
  const totalPlatformFees = users.reduce((sum, u) => sum + (u.totalPlatformFees || 0), 0);

  // Filtering
  const filteredUsers = users.filter((u) => {
    if (filterRole === 'developer' && u.role !== 'developer') return false;
    if (filterRole === 'admin' && u.role !== 'admin' && u.role !== 'super_admin') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.companyName && u.companyName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super Administrador • Controlo de Contas
          </div>
          <h1 className="text-xl font-bold text-white">Utilizadores & Desenvolvedores da Plataforma</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão multi-tenant de desenvolvedores, parametrização da taxa de 20% e monitorização de acessos à API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-add-user"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Utilizador / Dev
          </button>
        </div>
      </div>

      {/* KPI Cards: Platform Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users & Devs */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de Utilizadores</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalUsers}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            <strong className="text-emerald-400">{developersCount}</strong> Desenvolvedores registados
          </p>
        </div>

        {/* Active Devs with Integrated Apps */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Devs Conectados na API</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Code className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-400">{activeDevsWithApps}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Projetos ativos a gerar chaves e chamadas
          </p>
        </div>

        {/* Platform Fee 20% Retained */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Taxa Plataforma Retida (20%)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {totalPlatformFees.toLocaleString('pt-AO')} <span className="text-xs font-bold text-slate-400">Kz</span>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            Receita líquida da Pay Yetux retida
          </p>
        </div>

        {/* Gross Volume Transacted */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Volume Bruto Global</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300">
            {totalGrossVolume.toLocaleString('pt-AO')} <span className="text-xs font-bold text-slate-400">Kz</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total movimentado por todos os clientes
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, email ou empresa..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterRole === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterRole('developer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterRole === 'developer'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Desenvolvedores ({developersCount})
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterRole === 'admin'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Administradores ({users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Utilizador / Conta</th>
                <th className="px-5 py-3.5">Papel & Taxa</th>
                <th className="px-5 py-3.5">Projetos / Apps</th>
                <th className="px-5 py-3.5">Vendas (Bruto / Líquido)</th>
                <th className="px-5 py-3.5">Taxa Retida (20%)</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Nenhum utilizador encontrado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{u.email}</span>
                            {u.phone && <span>• {u.phone}</span>}
                          </div>
                          {u.companyName && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3" />
                              {u.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role & Fee */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.role === 'super_admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : u.role === 'admin'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {u.role === 'super_admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3" /> Super Admin
                            </>
                          ) : u.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3" /> Administrador
                            </>
                          ) : (
                            <>
                              <Code className="w-3 h-3" /> Desenvolvedor
                            </>
                          )}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-emerald-400" />
                          Taxa: <strong className="text-white">{u.platformFeePercentage ?? 20}%</strong>
                        </div>
                      </div>
                    </td>

                    {/* Apps Count */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-white">{u.totalApps ?? 0}</span>
                        <span className="text-[11px] text-slate-500">projetos</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.totalCharges ?? 0} transações
                      </div>
                    </td>

                    {/* Sales Volume */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">
                        {(u.totalGrossVolume ?? 0).toLocaleString('pt-AO')} Kz
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        Líq. Dev: {(u.totalNetVolume ?? 0).toLocaleString('pt-AO')} Kz
                      </div>
                    </td>

                    {/* Platform Fee Retained */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-emerald-400">
                        +{(u.totalPlatformFees ?? 0).toLocaleString('pt-AO')} Kz
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Retenção Pay Yetux
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {u.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Editar Utilizador"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {u.role !== 'super_admin' && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg border border-rose-800/40 transition-colors"
                            title="Eliminar Utilizador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {modalMode === 'create' ? 'Adicionar Novo Utilizador / Dev' : 'Editar Utilizador'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome do cliente ou desenvolvedor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Endereço de E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="dev@exemplo.ao"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telemóvel
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Empresa ou Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="Ex: Yetux Tech Solutions"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Papel / Permissão
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="developer">Desenvolvedor (Portal API & Levantamentos)</option>
                    <option value="admin">Administrador (Acesso Gerencial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Taxa da Plataforma (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formFeePercentage}
                      onChange={(e) => setFormFeePercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                      %
                    </div>
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Estado da Conta
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="active">Ativo (Permitido gerar pagamentos)</option>
                      <option value="inactive">Inativo (Bloqueado)</option>
                    </select>
                  </div>
                )}

                <div className={modalMode === 'edit' ? '' : 'sm:col-span-2'}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {modalMode === 'create' ? 'Palavra-passe *' : 'Nova Palavra-passe (Opcional)'}
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    required={modalMode === 'create'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres' : 'Deixe em branco para manter'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Information notice */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                Ao criar uma conta de desenvolvedor, a plataforma provisiona automaticamente um projeto inicial com chaves de API Live e Teste, além da configuração de retenção da taxa de <strong>{formFeePercentage}%</strong>.
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm transition-all"
                >
                  {isSubmitting ? 'A guardar...' : modalMode === 'create' ? 'Criar Utilizador' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
