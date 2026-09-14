import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ArrowLeftRight, 
  Link2, 
  Store, 
  Code2, 
  Settings, 
  PlusCircle, 
  RefreshCw,
  Zap
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewCharge: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  environment: 'live' | 'test';
  setEnvironment: (env: 'live' | 'test') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewCharge,
  onRefresh,
  isRefreshing,
  environment,
  setEnvironment,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transacções', icon: ArrowLeftRight },
    { id: 'links', label: 'Links de Pagamento', icon: Link2 },
    { id: 'store', label: 'Mini Loja', icon: Store },
    { id: 'api', label: 'API & Webhooks', icon: Code2 },
    { id: 'admin', label: 'Painel Admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">Nuvex Gateway</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium">
                  Multi-Provedor
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">MCX Express & Referência Bancária</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Environment */}
          <div className="flex items-center space-x-3">
            {/* Environment pill */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setEnvironment('live')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  environment === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ● Live
              </button>
              <button
                onClick={() => setEnvironment('test')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  environment === 'test'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ● Sandbox
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              title="Atualizar dados"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* New charge / checkout button */}
            <button
              id="btn-nova-cobranca"
              onClick={onOpenNewCharge}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Cobrança</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
