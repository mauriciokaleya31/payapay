import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Cpu, 
  User, 
  Phone, 
  Building, 
  UserPlus, 
  LogIn,
  ShoppingBag,
  UserCheck,
  ArrowLeft,
  Key
} from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToLanding?: () => void;
  initialTab?: 'login' | 'register';
  initialRole?: 'merchant' | 'customer';
}

export function LoginView({
  onLoginSuccess,
  onBackToLanding,
  initialTab = 'login',
  initialRole = 'merchant',
}: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form state: only 'merchant' (vendedor) or 'customer' (cliente) allowed
  const [regRole, setRegRole] = useState<'merchant' | 'customer'>(initialRole);
  const [regName, setRegName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha o seu e-mail e a palavra-passe.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Credenciais de acesso incorretas.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login. Verifique as credenciais digitadas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMessage('Nome, e-mail e palavra-passe são obrigatórios para o registo.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('A palavra-passe deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.register({
        name: regName.trim(),
        companyName: regCompanyName.trim() || undefined,
        phone: regPhone.trim() || undefined,
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });

      if (res.success && res.user) {
        const welcomeText =
          regRole === 'merchant'
            ? 'Conta de vendedor criada! Seu perfil KYC foi inicializado e já pode criar links e personalizar o checkout.'
            : 'Conta de cliente criada com sucesso! Aceda aos seus infoprodutos adquiridos.';
        setSuccessMessage(welcomeText);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 800);
      } else {
        setErrorMessage(res.error || 'Falha ao criar conta.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar o registo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Back to landing page button */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Página Inicial
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Pay Yetux
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                Infoprodutos & Pagamentos
              </span>
            </h1>
            <p className="text-xs text-slate-400">Vendas Digitais e Pagamentos em Angola</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-6 flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 max-w-xs mx-auto">
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Iniciar Sessão
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Criar Conta
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Atenção</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Sucesso</p>
                <p className="text-xs text-emerald-300/90 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Endereço de E-mail
                </label>
                <div className="mt-2 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@dominio.ao"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Palavra-passe
                </label>
                <div className="mt-2 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-300">Ambiente Seguro (HTTPS)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  EMIS Nuvex Angola
                </span>
              </div>

              <div>
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A validar credenciais...
                    </>
                  ) : (
                    <>
                      Entrar na Conta
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM (Vendor vs Customer Only) ================= */
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              {/* Role Selection: Merchant vs Customer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Tipo de Conta a Criar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRole('merchant')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      regRole === 'merchant'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <ShoppingBag className={`w-4 h-4 ${regRole === 'merchant' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      {regRole === 'merchant' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Vendedor</p>
                      <p className="text-[10px] text-slate-400">Vender Infoprodutos</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('customer')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      regRole === 'customer'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <UserCheck className={`w-4 h-4 ${regRole === 'customer' ? 'text-emerald-400' : 'text-slate-400'}`} />
                      {regRole === 'customer' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Cliente</p>
                      <p className="text-[10px] text-slate-400">Acessar Compras</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Nome Completo
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                  />
                </div>
              </div>

              {regRole === 'merchant' && (
                <div>
                  <label htmlFor="reg-company" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Nome da Sua Loja / Marca de Infoprodutos
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-company"
                      type="text"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      placeholder="Ex: Academia Digital Angola"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    E-mail
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@dominio.ao"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Telemóvel (Multicaixa)
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="923 000 000"
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Definir Palavra-passe
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="block w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-100"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A criar a sua conta...
                    </>
                  ) : (
                    <>
                      {regRole === 'merchant' ? 'Criar Conta de Vendedor' : 'Criar Conta de Cliente'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
