import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Link as LinkIcon, 
  ShoppingBag, 
  Key, 
  Sliders, 
  ScrollText, 
  ShieldCheck, 
  LogOut, 
  PlusCircle, 
  Radio,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Server,
  Terminal,
  Users,
  UserCog
} from 'lucide-react';
import { AdminUser, ProviderConfig } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  environment: 'live' | 'test';
  setEnvironment: (env: 'live' | 'test') => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenQuickCharge: () => void;
  onOpenProfile: () => void;
  providers: ProviderConfig[];
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  environment,
  setEnvironment,
  adminUser,
  onLogout,
  onOpenQuickCharge,
  onOpenProfile,
  providers,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const nuvexProvider = providers.find((p) => p.id === 'nuvex');
  const isAdmin = adminUser?.role === 'super_admin' || adminUser?.role === 'admin';

  const navigationItems = isAdmin
    ? [
        {
          id: 'dashboard',
          label: 'Visão Geral (Admin)',
          icon: LayoutDashboard,
          description: 'Métricas e volume financeiro global',
        },
        {
          id: 'users',
          label: 'Utilizadores & Devs',
          icon: Users,
          description: 'Gestão de contas, devs e taxa 20%',
          isFeatured: true,
        },
        {
          id: 'transactions',
          label: 'Transações Globais',
          icon: ArrowLeftRight,
          description: 'Multicaixa Express e GPR',
        },
        {
          id: 'links',
          label: 'Links de Pagamento',
          icon: LinkIcon,
          description: 'Checkouts diretos e partilháveis',
        },
        {
          id: 'store',
          label: 'Produtos & Catálogo',
          icon: ShoppingBag,
          description: 'Itens com link integrado',
        },
        {
          id: 'apps',
          label: 'Aplicações & API Keys',
          icon: Key,
          description: 'Credenciais e webhooks dos clientes',
        },
        {
          id: 'providers',
          label: 'Provedores de Pagamento',
          icon: Sliders,
          description: 'Nuvex API e conectores',
        },
        {
          id: 'developer_portal',
          label: 'Portal Dev & Levantamento',
          icon: Terminal,
          description: 'Simulação e ferramentas de dev',
        },
        {
          id: 'logs',
          label: 'Logs & Auditoria',
          icon: ScrollText,
          description: 'Webhooks, HMAC e eventos',
        },
      ]
    : [
        {
          id: 'developer_portal',
          label: 'Portal Dev & Empreendedor',
          icon: Terminal,
          description: 'Chaves de API, levantamento e saldo',
          isFeatured: true,
        },
        {
          id: 'apps',
          label: 'Minhas Aplicações & API Keys',
          icon: Key,
          description: 'Credenciais Live/Sandbox e Webhooks',
        },
        {
          id: 'transactions',
          label: 'Minhas Transações',
          icon: ArrowLeftRight,
          description: 'Histórico de pagamentos recebidos',
        },
        {
          id: 'links',
          label: 'Links de Pagamento',
          icon: LinkIcon,
          description: 'Checkouts diretos e partilháveis',
        },
        {
          id: 'store',
          label: 'Produtos & Loja',
          icon: ShoppingBag,
          description: 'Catálogo de itens para venda',
        },
      ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">Gateway Nuvex</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Portal de Pagamentos Angola</p>
            </div>
          </div>

          {/* Environment Switcher */}
          <div className="mt-4 p-1 bg-slate-950 rounded-lg flex items-center border border-slate-800/80">
            <button
              id="sidebar-env-live"
              type="button"
              onClick={() => setEnvironment('live')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                environment === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3 h-3 ${environment === 'live' ? 'text-white' : 'text-slate-500'}`} />
              Produção (Live)
            </button>
            <button
              id="sidebar-env-test"
              type="button"
              onClick={() => setEnvironment('test')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                environment === 'test'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className={`w-3 h-3 ${environment === 'test' ? 'text-white' : 'text-slate-500'}`} />
              SandBox (Test)
            </button>
          </div>

          {/* Nuvex Connection Status Pill */}
          <div className="mt-3 px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${nuvexProvider?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-[11px] font-medium text-slate-300">Nuvex API (GPO / GPR)</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {nuvexProvider?.isActive ? 'CONECTADA' : 'INATIVA'}
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="sidebar-btn-quick-charge"
            type="button"
            onClick={() => {
              onOpenQuickCharge();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Cobrança Express</span>
          </button>
        </div>

        {/* Navigation Items (Organizados na lateral esquerda) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu de Gestão
          </div>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between group transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="truncate">
                    <p className={`text-xs font-medium leading-none ${isActive ? 'text-emerald-300 font-semibold' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Documentação & Recursos
          </div>
          <a
            href="https://pagamentos-nuvex.lovable.app/docs"
            target="_blank"
            rel="noreferrer"
            className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs">API Nuvex Docs</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </nav>

        {/* User Footer Profile & Logout */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
          <div 
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            className="flex items-center justify-between mb-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 cursor-pointer transition-all group"
            title="Clique para editar o seu perfil"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {adminUser?.avatarUrl ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight group-hover:text-emerald-300 transition-colors">
                  {adminUser?.name || 'Utilizador'}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {adminUser?.email || ''}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              {adminUser?.role === 'super_admin' ? 'Super Admin' : adminUser?.role === 'admin' ? 'Admin' : 'Dev'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="sidebar-btn-profile"
              type="button"
              onClick={onOpenProfile}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <UserCog className="w-3.5 h-3.5 text-emerald-400" />
              <span>Meu Perfil</span>
            </button>

            <button
              id="sidebar-btn-logout"
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
