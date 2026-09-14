import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  Eye,
  EyeOff,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a palavra-passe.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Credenciais de acesso incorretas.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login. Verifique as credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdminCredentials = () => {
    setEmail('kaleyapt@gmail.com');
    setPassword('Mauricio.200');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Gateway Nuvex
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                Oficial Angola
              </span>
            </h1>
            <p className="text-xs text-slate-400">Plataforma Intermediária de Pagamentos</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-semibold tracking-tight text-slate-100">
          Autenticação de Segurança
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Acesso restrito ao Painel de Administração & Métricas Financeiras
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Falha no Acesso</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                E-mail do Administrador
              </label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kaleyapt@gmail.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Palavra-passe
                </label>
                <span className="text-[11px] text-slate-500">PBKDF2 100k SHA-256</span>
              </div>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">Ambiente Seguro (HTTPS / TLS)</span>
              </div>
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Preencher Administrador
              </button>
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
                    Validando Acesso Seguro...
                  </>
                ) : (
                  <>
                    Entrar no Painel de Controlo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Helper Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-2">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Credenciais Oficiais Configuradas:
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                  ATIVO
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-400 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="text-slate-200">kaleyapt@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Palavra-passe:</span>
                  <span className="text-slate-200">Mauricio.200</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Nuvex API Conectada
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-400" /> Multicaixa Express & GPR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
