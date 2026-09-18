import React from 'react';
import { 
  Menu, 
  RefreshCw, 
  PlusCircle, 
  ShieldCheck, 
  Lock, 
  LogOut,
  Bell,
  Cpu
} from 'lucide-react';
import { AdminUser } from '../types';

interface TopHeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenQuickCharge: () => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  environment: 'live' | 'test';
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Visão Geral do Gateway',
    subtitle: 'Métricas financeiras, volume em Kwanzas e taxas de conversão',
  },
  sellers: {
    title: 'Gestão de Vendedores & Verificação KYC',
    subtitle: 'Aprovação de documentos de identidade, taxas personalizadas e auditoria de vendas',
  },
  users: {
    title: 'Utilizadores & Desenvolvedores',
    subtitle: 'Gestão de contas, atribuição de perfis e taxas de comissão da plataforma',
  },
  transactions: {
    title: 'Gestão de Transações',
    subtitle: 'Histórico de cobranças Multicaixa Express (GPO) e Referências (GPR)',
  },
  links: {
    title: 'Links de Pagamento Hosted',
    subtitle: 'Crie e partilhe links diretos de checkout sem precisar de código',
  },
  store: {
    title: 'Catálogo de Produtos & Infoprodutos',
    subtitle: 'Gestão de infoprodutos, arquivos para download e links integrados',
  },
  customer_portal: {
    title: 'Portal do Cliente',
    subtitle: 'Histórico de compras, recibos fiscais e downloads de infoprodutos',
  },
  developer_portal: {
    title: 'Portal do Desenvolvedor & Vendedor',
    subtitle: 'Simulações de API, levantamentos bancários e credenciais',
  },
  apps: {
    title: 'Aplicações & Credenciais de Clientes',
    subtitle: 'Chaves de API (Live/Test) e configurações de webhooks para desenvolvedores',
  },
  providers: {
    title: 'Gestão de Provedores de Pagamento',
    subtitle: 'Configuração da API Nuvex oficial, chaves e teste de latência em tempo real',
  },
  logs: {
    title: 'Auditoria & Logs de Segurança',
    subtitle: 'Rastreamento de requisições, callbacks de webhooks e validações HMAC',
  },
  landing: {
    title: 'Página Inicial & Vendas de Infoprodutos',
    subtitle: 'Pré-visualização da landing page comercial do Pay Yetux Angola',
  },
};

export function TopHeader({
  activeTab,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing,
  onOpenQuickCharge,
  adminUser,
  onLogout,
  onOpenProfile,
  environment,
}: TopHeaderProps) {
  const currentTabInfo = tabTitles[activeTab] || {
    title: 'Painel Administrativo',
    subtitle: 'Gateway de Pagamentos Angola',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: mobile hamburger + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {currentTabInfo.title}
                </h1>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                  environment === 'live'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {environment === 'live' ? 'LIVE' : 'SANDBOX'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right section: actions, refresh, admin quick info */}
          <div className="flex items-center gap-3">
            {/* Live API Nuvex pulse */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-300 font-medium">Nuvex Engine Online</span>
            </div>

            {/* Refresh Button */}
            <button
              id="header-btn-refresh"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
              title="Atualizar dados em tempo real"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* New Quick Charge Button */}
            <button
              id="header-btn-quick-charge"
              type="button"
              onClick={onOpenQuickCharge}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Cobrança</span>
            </button>

            {/* User Profile Mini Badge (Clickable to Edit Profile) */}
            <button
              id="header-btn-profile"
              type="button"
              onClick={onOpenProfile}
              className="hidden sm:flex items-center gap-2.5 pl-3 py-1 pr-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left group"
              title="Editar Perfil da Conta"
            >
              {adminUser?.avatarUrl ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block leading-tight group-hover:text-emerald-300 transition-colors">
                  {adminUser?.name || 'Utilizador'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono leading-none mt-0.5">
                  {adminUser?.role === 'super_admin' ? 'Super Admin' : adminUser?.role === 'admin' ? 'Admin' : 'Desenvolvedor'}
                </span>
              </div>
            </button>

            {/* Logout button */}
            <button
              id="header-btn-logout"
              type="button"
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-colors"
              title="Terminar sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
