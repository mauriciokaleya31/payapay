import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { PaymentLinksView } from './components/PaymentLinksView';
import { StoreView } from './components/StoreView';
import { DeveloperApiView } from './components/DeveloperApiView';
import { DeveloperPortalView } from './components/DeveloperPortalView';
import { AdminProvidersView } from './components/AdminProvidersView';
import { HostedCheckoutModal } from './components/HostedCheckoutModal';
import { api, setOnUnauthorizedCallback } from './services/api';
import { 
  Charge, 
  PaymentLink, 
  Product, 
  ClientApp, 
  ProviderConfig, 
  AuditLog, 
  GatewayStats,
  AdminUser
} from './types';
import { 
  Zap, 
  X, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function App() {
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [apps, setApps] = useState<ClientApp[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Modal States
  const [hostedCheckoutItem, setHostedCheckoutItem] = useState<PaymentLink | Product | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [isQuickChargeOpen, setIsQuickChargeOpen] = useState(false);

  // Quick Charge Form state
  const [quickAmount, setQuickAmount] = useState('15000');
  const [quickMethod, setQuickMethod] = useState<'GPO' | 'GPR'>('GPO');
  const [quickPhone, setQuickPhone] = useState('923456789');
  const [quickDesc, setQuickDesc] = useState('Cobrança Rápida Nuvex');
  const [quickCustomerName, setQuickCustomerName] = useState('Cliente Luanda');
  const [isCreatingQuickCharge, setIsCreatingQuickCharge] = useState(false);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Setup 401 Unauthorized interceptor
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      setIsAuthenticated(false);
      setAdminUser(null);
      showToast('Sessão Expirada', 'Por favor, autentique-se novamente para continuar.');
    });
  }, []);

  // Check initial authentication on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.checkAuth();
        if (user) {
          setAdminUser(user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setAdminUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initAuth();
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const [statsData, chargesData, linksData, prodsData, appsData, provsData, logsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getCharges().catch(() => []),
        api.getLinks().catch(() => []),
        api.getProducts().catch(() => []),
        api.getApps().catch(() => []),
        api.getProviders().catch(() => []),
        api.getLogs().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setCharges(chargesData);
      setLinks(linksData);
      setProducts(prodsData);
      setApps(appsData);
      setProviders(provsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();

      // Check if URL is a hosted payment link /pay/:slug
      if (window.location.pathname.startsWith('/pay/')) {
        const slug = window.location.pathname.replace('/pay/', '').split('/')[0].trim();
        if (slug) {
          api.getLink(slug).then((link) => {
            if (link) setHostedCheckoutItem(link);
          }).catch(() => {});
        }
      }

      // Periodic refresh
      const timer = setInterval(() => {
        loadData();
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, loadData]);

  // Auth Handlers
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setIsAuthenticated(true);
    showToast('Sessão Iniciada', `Bem-vindo, ${user.name} (${user.email})`);
    loadData();
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('Sessão Terminada', 'Acesso seguro encerrado.');
  };

  // Handle Quick Charge creation
  const handleCreateQuickCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount) return;

    setIsCreatingQuickCharge(true);
    try {
      const res = await api.createCharge({
        amount: Number(quickAmount),
        method: quickMethod,
        phoneNumber: quickMethod === 'GPO' ? quickPhone : undefined,
        description: quickDesc,
        customerName: quickCustomerName,
      });

      setIsQuickChargeOpen(false);
      showToast('Cobrança Criada com Sucesso', `${res.charge.amount} Kz gerados via Nuvex (${res.charge.method})`);
      await loadData();

      // Open inspection drawer for the newly created charge
      setSelectedCharge(res.charge);
      setActiveTab('transactions');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar cobrança');
    } finally {
      setIsCreatingQuickCharge(false);
    }
  };

  // Handlers for child components
  const handleSyncCharge = async (id: string) => {
    try {
      const updated = await api.syncChargeStatus(id);
      setSelectedCharge(updated);
      await loadData();
      showToast('Sincronização Concluída', `Estado atualizado para: ${updated.status.toUpperCase()}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSimulatePay = async (id: string) => {
    try {
      const updated = await api.simulatePayment(id);
      setSelectedCharge(updated);
      await loadData();
      showToast('Pagamento Confirmado', `A cobrança de ${updated.amount} Kz foi aprovada!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateLink = async (payload: Partial<PaymentLink>) => {
    await api.createLink(payload);
    await loadData();
    showToast('Link de Pagamento Criado', 'Novo link gerado e pronto para partilha.');
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm('Deseja realmente eliminar este link de pagamento?')) {
      await api.deleteLink(id);
      await loadData();
      showToast('Link Removido', 'O link de pagamento foi eliminado.');
    }
  };

  const handleCreateProduct = async (payload: Partial<Product> & { createLink?: boolean }) => {
    await api.createProduct(payload);
    await loadData();
    showToast('Produto Adicionado', 'Produto registado no catálogo com sucesso.');
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja eliminar este produto do catálogo?')) {
      await api.deleteProduct(id);
      await loadData();
      showToast('Produto Removido', 'O produto foi excluído da loja.');
    }
  };

  const handleCreateApp = async (payload: Partial<ClientApp>) => {
    await api.createApp(payload);
    await loadData();
    showToast('Aplicação Registada', 'Novas chaves Live e Sandbox geradas.');
  };

  const handleUpdateApp = async (id: string, payload: Partial<ClientApp>) => {
    await api.updateApp(id, payload);
    await loadData();
    showToast('Aplicação Atualizada', 'Configurações de Webhook salvas.');
  };

  const handleDeleteApp = async (id: string) => {
    if (confirm('Eliminar esta aplicação e revogar todas as chaves?')) {
      await api.deleteApp(id);
      await loadData();
      showToast('Aplicação Excluída', 'Credenciais revogadas.');
    }
  };

  const handleUpdateProvider = async (id: string, payload: Partial<ProviderConfig>) => {
    await api.updateProvider(id, payload);
    await loadData();
    showToast('Provedor Atualizado', 'Parâmetros de conexão e métodos salvos.');
  };

  const handleCreateProvider = async (payload: Partial<ProviderConfig>) => {
    await api.createProvider(payload);
    await loadData();
    showToast('Gateway Registado', 'O novo gateway foi integrado ao Pay Yetux.');
  };

  const handleDeleteProvider = async (id: string) => {
    await api.deleteProvider(id);
    await loadData();
    showToast('Gateway Removido', 'O gateway foi removido da plataforma.');
  };

  const handleTestConnection = async (id: string, override?: Partial<ProviderConfig>) => {
    const res = await api.testProvider(id, override);
    await loadData();
    return res;
  };

  const handleTestWebhook = async (url: string, secret: string, event: string) => {
    return await api.testWebhook(url, secret, event);
  };

  const handlePaymentSuccess = async (charge: Charge) => {
    showToast('Pagamento Recebido!', `${charge.amount} Kz recebidos com sucesso.`);
    await loadData();
  };

  const activeProvider = providers.find((p) => p.id === 'nuvex') || providers[0];

  // ----------------------------------------------------
  // 1. Splash Screen during initial auth verification
  // ----------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-900/40 ring-1 ring-emerald-400/30 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-lg font-bold text-slate-100">Gateway Nuvex Angola</h2>
          <p className="text-xs text-slate-400 mt-1">Verificando credenciais e integridade da sessão...</p>
        </div>
        <div className="mt-6 w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. Authentication Enforcement: Show LoginView
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // ----------------------------------------------------
  // 3. Authenticated Admin Panel with Left Sidebar
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Left Navigation Sidebar (Menu do lado esquerdo organizado) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        environment={environment}
        setEnvironment={setEnvironment}
        adminUser={adminUser}
        onLogout={handleLogout}
        onOpenQuickCharge={() => setIsQuickChargeOpen(true)}
        providers={providers}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by left sidebar on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          onOpenQuickCharge={() => setIsQuickChargeOpen(true)}
          adminUser={adminUser}
          onLogout={handleLogout}
          environment={environment}
        />

        {/* Dynamic Tab Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentCharges={charges}
              providerConfig={activeProvider}
              onNavigate={setActiveTab}
              onInspectCharge={(c) => {
                setSelectedCharge(c);
                setActiveTab('transactions');
              }}
              onOpenNewCharge={() => setIsQuickChargeOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              charges={charges}
              apps={apps}
              onSyncCharge={handleSyncCharge}
              onSimulatePay={handleSimulatePay}
              selectedCharge={selectedCharge}
              setSelectedCharge={setSelectedCharge}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'links' && (
            <PaymentLinksView
              links={links}
              onCreateLink={handleCreateLink}
              onDeleteLink={handleDeleteLink}
              onOpenCheckout={(l) => setHostedCheckoutItem(l)}
            />
          )}

          {activeTab === 'store' && (
            <StoreView
              products={products}
              onCreateProduct={handleCreateProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenProductCheckout={(p) => setHostedCheckoutItem(p)}
              onNavigateToLinks={() => setActiveTab('links')}
            />
          )}

          {activeTab === 'developer_portal' && (
            <DeveloperPortalView
              onSwitchToAdmin={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'apps' && (
            <DeveloperApiView
              apps={apps}
              onCreateApp={handleCreateApp}
              onUpdateApp={handleUpdateApp}
              onDeleteApp={handleDeleteApp}
              onTestWebhook={handleTestWebhook}
              onOpenFullPortal={() => setActiveTab('developer_portal')}
            />
          )}

          {activeTab === 'providers' && (
            <AdminProvidersView
              providers={providers}
              logs={logs}
              onUpdateProvider={handleUpdateProvider}
              onTestConnection={handleTestConnection}
              onRefreshLogs={loadData}
              onCreateProvider={handleCreateProvider}
              onDeleteProvider={handleDeleteProvider}
            />
          )}

          {activeTab === 'logs' && (
            <AdminProvidersView
              providers={providers}
              logs={logs}
              onUpdateProvider={handleUpdateProvider}
              onTestConnection={handleTestConnection}
              onRefreshLogs={loadData}
              onCreateProvider={handleCreateProvider}
              onDeleteProvider={handleDeleteProvider}
            />
          )}
        </main>
      </div>

      {/* Hosted Checkout Modal (when clicking "Abrir Checkout" on any link or product) */}
      {hostedCheckoutItem && (
        <HostedCheckoutModal
          item={hostedCheckoutItem}
          onClose={() => setHostedCheckoutItem(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Quick Charge Creator Modal */}
      {isQuickChargeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Criar Cobrança Instantânea</h3>
                  <p className="text-[11px] text-slate-400">Gera um pagamento via Nuvex (GPO / GPR)</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickChargeOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCharge} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Montante (AOA) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">Kz</span>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="15000"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Método de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickMethod('GPO')}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                      quickMethod === 'GPO'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>MCX Express</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickMethod('GPR')}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                      quickMethod === 'GPR'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-teal-400" />
                      <span>Referência</span>
                    </div>
                  </button>
                </div>
              </div>

              {quickMethod === 'GPO' && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Telemóvel MCX Express *</label>
                  <input
                    type="tel"
                    required
                    placeholder="923456789"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">O cliente receberá uma notificação push no telemóvel.</p>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nome do Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Descrição do Pagamento</label>
                <input
                  type="text"
                  placeholder="Ex: Fatura 2026/01"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreatingQuickCharge}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isCreatingQuickCharge ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando via Nuvex...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Emitir Cobrança Imediata</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">{toastMessage.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-slate-300 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
