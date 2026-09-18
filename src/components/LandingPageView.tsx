import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  DollarSign, 
  Sparkles, 
  CreditCard, 
  TrendingUp, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Palette, 
  UserCheck, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Calculator,
  Lock,
  Star,
  Users
} from 'lucide-react';
import { PaymentLink, Product } from '../types';

interface LandingPageViewProps {
  onGoToLogin: () => void;
  onGoToRegister: (role?: 'merchant' | 'customer') => void;
  onOpenDemoCheckout?: () => void;
  links?: PaymentLink[];
  products?: Product[];
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGoToLogin,
  onGoToRegister,
  onOpenDemoCheckout,
}) => {
  // Calculator state
  const [productPrice, setProductPrice] = useState<number>(15000);
  const [monthlySales, setMonthlySales] = useState<number>(40);
  const platformFeeRate = 0.10; // 10%

  const grossTotal = productPrice * monthlySales;
  const platformFee = grossTotal * platformFeeRate;
  const netEarnings = grossTotal - platformFee;

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 py-2.5 px-4 text-center text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Venda infoprodutos em Angola com <strong>Multicaixa Express</strong> e aprovação em tempo real.</span>
        <button 
          onClick={() => onGoToRegister('merchant')}
          className="underline hover:text-white font-semibold ml-1 transition-colors"
        >
          Criar Conta de Vendedor &rarr;
        </button>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Pay Yetux
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Infoprodutos
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Vendas Digitais & Assinaturas em Angola</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-emerald-400 transition-colors">Recursos</a>
            <a href="#infoprodutos" className="hover:text-emerald-400 transition-colors">Infoprodutos</a>
            <a href="#checkout" className="hover:text-emerald-400 transition-colors">Checkout Personalizado</a>
            <a href="#simulador" className="hover:text-emerald-400 transition-colors">Simulador de Lucro</a>
            <a href="#taxas" className="hover:text-emerald-400 transition-colors">Taxas</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              id="btn-nav-login"
              onClick={onGoToLogin}
              className="text-sm font-semibold text-slate-200 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Entrar
            </button>
            <button
              id="btn-nav-start-selling"
              onClick={() => onGoToRegister('merchant')}
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-lg shadow-sm shadow-emerald-900/40 transition-all flex items-center gap-1.5 ring-1 ring-emerald-400/30"
            >
              Começar a Vender
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          A Plataforma de Infoprodutos Feita para Angola
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Venda os seus <span className="text-emerald-400">Infoprodutos</span>, Cursos e Assinaturas em Angola
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Receba pagamentos diretos em Kwanzas via <strong>Multicaixa Express</strong> e Referência Bancária com aprovação em segundos. Automatize a entrega dos seus arquivos digitais e personalize o seu próprio checkout.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            id="btn-hero-seller-register"
            onClick={() => onGoToRegister('merchant')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 ring-1 ring-emerald-400/30"
          >
            Criar Conta de Vendedor
            <ArrowRight className="w-5 h-5" />
          </button>
          {onOpenDemoCheckout && (
            <button
              id="btn-hero-demo-checkout"
              onClick={onOpenDemoCheckout}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Ver Demonstração de Checkout
            </button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-14 pt-10 border-t border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Multicaixa Express</p>
              <p className="text-xs text-slate-400">Push instantâneo no telemóvel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Referência GPR</p>
              <p className="text-xs text-slate-400">Entidade e Referência EMIS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Conta Automática</p>
              <p className="text-xs text-slate-400">Comprador recebe acesso na hora</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Checkout Próprio</p>
              <p className="text-xs text-slate-400">Personalize com sua marca</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infoproduct Types Showcase */}
      <section id="infoprodutos" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Infoprodutos & Formatos Suportados
            </h2>
            <p className="text-3xl font-extrabold text-white sm:text-4xl">
              Tudo o que você precisa para monetizar seu conhecimento em Angola
            </p>
            <p className="mt-3 text-slate-300">
              Venda conteúdos digitais com entrega 100% automatizada assim que o pagamento via Multicaixa for confirmado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">E-books & Guias em PDF</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Faça o upload do seu livro digital. Após o pagamento, o comprador faz o download imediato e recebe uma cópia segura no e-mail.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Download protegido com fatura gerada
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Histórico permanente no portal do aluno
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cursos & Treinamentos Online</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Crie links de pagamento para matrículas em videoaulas, workshops e masterclasses. Notifique os alunos por SMS ou WhatsApp.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Conta de estudante gerada automaticamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Links de checkout personalizáveis por turma
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Assinaturas & Mentorias</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Cobrança recorrente para comunidades VIP, mentorias privadas, consultorias e softwares como serviço (SaaS).
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Planos mensais, trimestrais e anuais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gestão de cobrança e reenvio de referências
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Customization Feature Highlight */}
      <section id="checkout" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              <Palette className="w-3.5 h-3.5" />
              Experiência Sob Medida
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Personalize o seu próprio Checkout para multiplicar as suas vendas
            </h2>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Diga adeus a páginas de pagamento genéricas. No Pay Yetux, cada criador personaliza as cores da sua marca, adiciona o seu logótipo, selos de garantia de 7 ou 14 dias, contagem regressiva de urgência e depoimentos de alunos reais.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cores e Identidade Visual</h4>
                  <p className="text-xs text-slate-400">Combine a página com a sua marca para transmitir 100% de confiança ao cliente.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gatilhos de Urgência & Depoimentos</h4>
                  <p className="text-xs text-slate-400">Ative contadores de oferta por tempo limitado e exiba avaliações de 5 estrelas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Criação de Conta Automática para o Comprador</h4>
                  <p className="text-xs text-slate-400">O comprador compra como convidado sem atrito. O sistema cria o acesso e envia a fatura por e-mail.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => onGoToRegister('merchant')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
              >
                Criar Meu Checkout Agora
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mock Visual of Standalone Checkout */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">payyetux.ao/checkout/curso-marketing</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Checkout Dedicado
              </span>
            </div>

            {/* Inner Checkout Preview */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-xs">
                    AC
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Academia Criativa Angola</p>
                    <p className="text-[10px] text-emerald-400">Vendedor Verificado KYC</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Preço</span>
                  <p className="text-base font-black text-emerald-400">15.000 Kz</p>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Guia de Vendas Digitais & Tráfego Pago</p>
                  <p className="text-[11px] text-slate-400">Acesso instantâneo a PDF + Vídeos gravados</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="h-8 bg-slate-900 rounded border border-slate-800 flex items-center px-3 text-xs text-slate-300">
                  Nome Completo: João Manuel
                </div>
                <div className="h-8 bg-slate-900 rounded border border-slate-800 flex items-center px-3 text-xs text-slate-300">
                  E-mail: joao@gmail.com
                </div>
                <div className="h-8 bg-slate-900 rounded border border-slate-800 flex items-center px-3 text-xs text-slate-300">
                  Telemóvel MCX: 923 456 789
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <p className="text-[11px] font-bold text-emerald-300">Multicaixa Express</p>
                  <p className="text-[9px] text-slate-400">Push no Telemóvel</p>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center opacity-75">
                  <p className="text-[11px] font-bold text-slate-300">Referência GPR</p>
                  <p className="text-[9px] text-slate-400">Caixa Automático</p>
                </div>
              </div>

              <button className="w-full py-2.5 rounded-lg bg-emerald-600 font-bold text-xs text-white shadow">
                Pagar Agora 15.000 Kz &rarr;
              </button>

              <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Garantia incondicional de 7 dias com reembolso
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulador" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Calculator className="w-3.5 h-3.5" />
              Calculadora de Faturamento
            </div>
            <h2 className="text-3xl font-extrabold text-white">Simule os seus ganhos mensais</h2>
            <p className="mt-2 text-sm text-slate-300">
              Veja quanto você recebe na sua conta bancária angolana (BAI, BFA, BIC, etc.) ao vender os seus infoprodutos.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Preço do Infoproduto (Kz)
                    </label>
                    <span className="text-base font-extrabold text-emerald-400">{formatKz(productPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>1.000 Kz</span>
                    <span>50.000 Kz</span>
                    <span>100.000 Kz</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Vendas Estimadas por Mês
                    </label>
                    <span className="text-base font-extrabold text-emerald-400">{monthlySales} vendas</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={monthlySales}
                    onChange={(e) => setMonthlySales(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>5 vendas</span>
                    <span>250 vendas</span>
                    <span>500 vendas</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Sem custos fixos mensais
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Você só paga a comissão de plataforma quando realizar uma venda aprovada. Se não vender nada, não paga nada.
                  </p>
                </div>
              </div>

              {/* Results Box */}
              <div className="bg-slate-950 rounded-xl p-6 border border-emerald-500/20 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seu Lucro Líquido no Bolso</span>
                  <p className="text-4xl sm:text-5xl font-black text-emerald-400 mt-2 tracking-tight">
                    {formatKz(netEarnings)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Transferido diretamente para o seu IBAN bancário.</p>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-6 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Volume Total Bruto:</span>
                    <span className="font-semibold text-white">{formatKz(grossTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxa da Plataforma Pay Yetux (10%):</span>
                    <span className="text-rose-400 font-medium">-{formatKz(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-2 border-t border-slate-800">
                    <span>Você recebe líquido (90%):</span>
                    <span>{formatKz(netEarnings)}</span>
                  </div>
                </div>

                <button
                  onClick={() => onGoToRegister('merchant')}
                  className="w-full mt-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
                >
                  Começar a Faturar Hoje
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing / Taxas */}
      <section id="taxas" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
          Taxas Claras & Sem Letras Miúdas
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Você só paga quando vender
        </p>
        <p className="text-slate-300 text-sm max-w-xl mx-auto mb-10">
          Sem mensalidades, sem custos de ativação ou taxas ocultas de servidor.
        </p>

        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            Plano Produtor Digital
          </div>
          <div className="flex items-baseline justify-center gap-1 my-3">
            <span className="text-5xl font-black text-white">10%</span>
            <span className="text-slate-400 text-sm">por venda realizada</span>
          </div>
          <p className="text-xs text-slate-300 mb-6">
            Taxa única com tudo incluído: gateway Multicaixa Express, processamento GPR, hospedagem de arquivos e envio de e-mails com fatura.
          </p>

          <ul className="space-y-3 text-left text-xs text-slate-300 mb-8">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Links de Pagamento ilimitados
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Checkout 100% personalizável com sua marca
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Criação automática de conta para seus alunos
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Levantamentos bancários automáticos para BAI, BFA, BIC
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Verificação KYC prioritária
            </li>
          </ul>

          <button
            onClick={() => onGoToRegister('merchant')}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            Cadastrar Gratuitamente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-white font-bold text-sm">Pay Yetux Gateway Angola</span>
          </div>

          <p className="text-center text-slate-500">
            &copy; {new Date().getFullYear()} Pay Yetux. Infraestrutura de Infoprodutos, Assinaturas e Pagamentos Multicaixa Express.
          </p>

          <div className="flex items-center gap-4">
            <button onClick={onGoToLogin} className="hover:text-emerald-400 transition-colors">
              Acesso Restrito
            </button>
            <span>&bull;</span>
            <button onClick={() => onGoToRegister('customer')} className="hover:text-emerald-400 transition-colors">
              Portal do Aluno
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
