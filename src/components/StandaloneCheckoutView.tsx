import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Star, 
  Download, 
  ArrowLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  FileText
} from 'lucide-react';
import { PaymentLink, Product, Charge, PaymentMethodType, CheckoutCustomization } from '../types';
import { api } from '../services/api';

interface StandaloneCheckoutViewProps {
  item: PaymentLink | Product;
  onBack?: () => void;
  onPaymentSuccess?: (charge: Charge) => void;
  onOpenCustomerPortal?: () => void;
}

export const StandaloneCheckoutView: React.FC<StandaloneCheckoutViewProps> = ({
  item,
  onBack,
  onPaymentSuccess,
  onOpenCustomerPortal,
}) => {
  const customization: CheckoutCustomization = item.customization || {
    brandName: 'Pay Yetux Vendas Digitais',
    brandColor: '#059669', // Emerald
    guaranteeBadge: true,
    guaranteeDays: 7,
    guaranteeText: 'Garantia incondicional de 7 dias com devolução imediata do seu dinheiro.',
    buttonText: 'Concluir Compra Segura',
    showCountdown: true,
    countdownMinutes: 15,
  };

  const isProduct = 'category' in item;
  const title = isProduct ? (item as Product).name : (item as PaymentLink).title;
  const description = item.description || 'Acesso imediato ao infoproduto e materiais digitais.';
  const amount = item.price !== undefined ? item.price : (item as PaymentLink).amount;
  const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';
  const digitalFileUrl = (item as any).digitalFileUrl;

  // Buyer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('923456789');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('GPO');

  // Checkout Steps: 'form' | 'processing' | 'awaiting_payment' | 'paid' | 'failed'
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'awaiting_payment' | 'paid' | 'failed'>('form');
  const [charge, setCharge] = useState<Charge | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Scarcity Countdown Timer
  const [timeLeft, setTimeLeft] = useState((customization.countdownMinutes || 15) * 60);

  useEffect(() => {
    if (!customization.showCountdown) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [customization.showCountdown]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  // Handle Form Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      setErrorMessage('O seu e-mail é obrigatório para enviarmos o acesso e a fatura.');
      return;
    }

    if (selectedMethod === 'GPO' && !customerPhone.trim()) {
      setErrorMessage('Informe o número de telemóvel associado ao Multicaixa Express.');
      return;
    }

    setCheckoutStep('processing');
    setErrorMessage(null);

    try {
      const res = await api.createCharge({
        amount,
        method: selectedMethod,
        phoneNumber: customerPhone.trim(),
        description: `Compra de Infoproduto: ${title}`,
        customerName: customerName.trim() || 'Cliente Infoproduto',
        customerEmail: customerEmail.trim(),
        productId: isProduct ? item.id : undefined,
        paymentLinkId: !isProduct ? item.id : undefined,
      });

      if (res.success && res.charge) {
        setCharge(res.charge);
        if (res.charge.status === 'paid') {
          setCheckoutStep('paid');
          if (onPaymentSuccess) onPaymentSuccess(res.charge);
        } else {
          setCheckoutStep('awaiting_payment');
        }
      } else {
        setCheckoutStep('failed');
        setErrorMessage(res.message || 'Falha ao iniciar pagamento.');
      }
    } catch (err: any) {
      setCheckoutStep('failed');
      setErrorMessage(err.message || 'Erro ao processar checkout.');
    }
  };

  // Poll for payment approval if awaiting
  useEffect(() => {
    if (checkoutStep !== 'awaiting_payment' || !charge) return;

    const pollInterval = setInterval(async () => {
      try {
        const updated = await api.syncChargeStatus(charge.id);
        if (updated.status === 'paid') {
          setCharge(updated);
          setCheckoutStep('paid');
          if (onPaymentSuccess) onPaymentSuccess(updated);
          clearInterval(pollInterval);
        } else if (updated.status === 'failed') {
          setCharge(updated);
          setCheckoutStep('failed');
          setErrorMessage('O pagamento não foi aprovado ou expirou no Multicaixa.');
          clearInterval(pollInterval);
        }
      } catch {
        // Continue polling silently
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [checkoutStep, charge, onPaymentSuccess]);

  // Simulate payment approval for testing/demo
  const handleSimulateApproval = async () => {
    if (!charge) return;
    try {
      const updated = await api.simulatePayment(charge.id);
      setCharge(updated);
      setCheckoutStep('paid');
      if (onPaymentSuccess) onPaymentSuccess(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao simular aprovação.');
    }
  };

  const handleCopyGpr = () => {
    if (!charge) return;
    const text = `Entidade: ${charge.referenceEntity || '00123'} | Ref: ${charge.referenceNumber || '999123456'} | Valor: ${formatKz(charge.amount)}`;
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Generate Styled Invoice Receipt
  const handleDownloadInvoice = () => {
    if (!charge) return;
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Fatura / Recibo Oficial #${charge.merchantTransactionId || charge.id.substring(0, 8)}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .receipt-box { max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: bold; color: #059669; }
          .badge-paid { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 99px; font-weight: bold; font-size: 12px; display: inline-block; }
          .details { margin: 20px 0; }
          .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 20px; padding-top: 12px; border-top: 2px solid #0f172a; }
          .footer { margin-top: 32px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="brand">${customization.brandName || 'Pay Yetux Angola'}</div>
              <div style="font-size: 12px; color: #64748b;">Processamento Seguro Multicaixa Express</div>
            </div>
            <div style="text-align: right;">
              <span class="badge-paid">PAGAMENTO CONFIRMADO</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Data: ${new Date(charge.paidAt || charge.createdAt).toLocaleString('pt-AO')}</div>
            </div>
          </div>
          <div class="details">
            <p><strong>Fatura Nº:</strong> FT-${charge.id.substring(4, 12).toUpperCase()}</p>
            <p><strong>Cliente:</strong> ${customerName || charge.customerName || 'Cliente Infoproduto'}</p>
            <p><strong>E-mail:</strong> ${customerEmail || charge.customerEmail}</p>
            <p><strong>Método:</strong> ${charge.method === 'GPO' ? 'Multicaixa Express (MCX)' : 'Referência Bancária (GPR)'}</p>
          </div>
          <div class="item-row">
            <span>${title}</span>
            <span>${formatKz(charge.amount)}</span>
          </div>
          <div class="total">
            <span>Total Pago:</span>
            <span style="color: #059669;">${formatKz(charge.amount)}</span>
          </div>
          <div class="footer">
            Documento emitido eletronicamente pela plataforma Pay Yetux sob conformidade EMIS Angola.
            Os dados da sua conta de cliente e link de acesso aos arquivos foram enviados por e-mail.
          </div>
        </div>
      </body>
      </html>
    `;
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              {customization.logoUrl ? (
                <img 
                  src={customization.logoUrl} 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                  style={{ backgroundColor: customization.brandColor || '#059669' }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                  {customization.brandName || 'Pay Yetux Vendas'}
                </h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" /> Checkout Seguro de Alta Conversão
                </p>
              </div>
            </div>
          </div>

          {/* Countdown Scarcity Header */}
          {customization.showCountdown && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Oferta expira em: <strong>{formatTimer(timeLeft)}</strong></span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        {checkoutStep === 'paid' ? (
          /* ================= SUCCESS STATE ================= */
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">Pagamento Aprovado com Sucesso!</h2>
            <p className="text-sm text-slate-300 mt-2">
              A sua compra de <strong>{title}</strong> no valor de <strong className="text-emerald-400">{formatKz(amount)}</strong> foi liquidada.
            </p>

            {/* Automatic Customer Account Notice */}
            <div className="mt-6 bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                Conta de Cliente Criada Automaticamente
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para sua comodidade, criámos a sua conta com o e-mail <strong>{customerEmail || charge?.customerEmail}</strong>. 
                Enviámos as suas credenciais temporárias de acesso e o recibo de compra detalhado para o seu e-mail.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {digitalFileUrl && (
                <a
                  href={digitalFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descarregar Infoproduto / Material Agora
                </a>
              )}

              <button
                onClick={handleDownloadInvoice}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Descarregar Fatura / Recibo em PDF
              </button>

              {onOpenCustomerPortal && (
                <button
                  onClick={onOpenCustomerPortal}
                  className="w-full py-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline transition-colors"
                >
                  Acessar Meu Portal de Compras & Histórico &rarr;
                </button>
              )}
            </div>
          </div>
        ) : checkoutStep === 'awaiting_payment' && charge ? (
          /* ================= AWAITING PAYMENT STATE ================= */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-2xl text-center">
            {charge.method === 'GPO' ? (
              <div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white">Confirme o Push no seu Telemóvel</h2>
                <p className="text-xs text-slate-300 mt-2">
                  Enviámos uma notificação de pagamento para o telemóvel <strong>{charge.phoneNumber}</strong>.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Abra a aplicação do seu banco ou Multicaixa Express e digite o seu PIN para aprovar o valor de <strong>{formatKz(charge.amount)}</strong>.
                </p>

                <div className="my-6 p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-emerald-400 font-medium">A aguardar confirmação em tempo real...</span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={handleSimulateApproval}
                    className="w-full py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition-all"
                  >
                    Simular Aprovação Instantânea (Modo Teste)
                  </button>
                  <button
                    onClick={() => setCheckoutStep('form')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Alterar número ou método
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white">Referência Multicaixa Gerada</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Pague no Multicaixa ou Internet Banking com os dados abaixo:
                </p>

                <div className="my-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Entidade:</span>
                    <strong className="text-white font-mono text-sm">{charge.referenceEntity || '00123'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Referência:</span>
                    <strong className="text-emerald-400 font-mono text-base">{charge.referenceNumber || '999123456'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Montante:</span>
                    <strong className="text-white text-sm">{formatKz(charge.amount)}</strong>
                  </div>
                </div>

                <button
                  onClick={handleCopyGpr}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 mb-3"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedRef ? 'Dados Copiados!' : 'Copiar Dados de Pagamento'}
                </button>

                <button
                  onClick={handleSimulateApproval}
                  className="w-full py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition-all mb-2"
                >
                  Simular Pagamento no Multicaixa
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ================= MAIN CHECKOUT FORM ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Product Summary & Guarantee */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-slate-800 relative">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-400 border border-slate-700">
                    {formatKz(amount)}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{description}</p>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total a Pagar:</span>
                  <span className="text-xl font-extrabold text-emerald-400">{formatKz(amount)}</span>
                </div>
              </div>

              {/* Guarantee Box */}
              {customization.guaranteeBadge && (
                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Garantia de {customization.guaranteeDays || 7} Dias
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {customization.guaranteeText || 'Se não ficar satisfeito com o infoproduto, devolvemos 100% do seu dinheiro sem complicações.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Testimonials */}
              {customization.showTestimonials && customization.testimonials && customization.testimonials.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Avaliações de Alunos</h4>
                  {customization.testimonials.slice(0, 2).map((t, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-300 italic mb-1.5">&ldquo;{t.comment}&rdquo;</p>
                      <span className="font-bold text-white text-[11px]">{t.author}</span>
                      {t.role && <span className="text-slate-500 text-[10px] ml-1.5">&bull; {t.role}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Buyer Data & Payment Method */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
              <div className="mb-5 pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Dados do Comprador</h3>
                <p className="text-xs text-slate-400">
                  Preencha os seus dados. O acesso ao produto e sua fatura serão enviados para o seu e-mail.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Manuel António"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    E-mail para Recebimento do Acesso
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu.email@exemplo.ao"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Uma conta segura de cliente será gerada automaticamente com este e-mail.
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Escolha o Método de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('GPO')}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        selectedMethod === 'GPO'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <Smartphone className={`w-5 h-5 ${selectedMethod === 'GPO' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {selectedMethod === 'GPO' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Multicaixa Express</p>
                        <p className="text-[10px] text-slate-400">Push no Telemóvel</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('GPR')}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        selectedMethod === 'GPR'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <CreditCard className={`w-5 h-5 ${selectedMethod === 'GPR' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {selectedMethod === 'GPR' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Referência GPR</p>
                        <p className="text-[10px] text-slate-400">ATM / Internet Banking</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Multicaixa Express Phone Input */}
                {selectedMethod === 'GPO' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Número do Telemóvel Multicaixa Express
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                        +244
                      </div>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="923 456 789"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-14 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Você receberá uma solicitação imediata para aprovação no telemóvel.
                    </span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={checkoutStep === 'processing'}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: customization.brandColor || '#059669' }}
                  >
                    {checkoutStep === 'processing' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        A iniciar pagamento seguro...
                      </>
                    ) : (
                      <>
                        {customization.buttonText || 'Pagar Agora'} &bull; {formatKz(amount)}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> Criptografia 256-bit
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Rede EMIS Nuvex
                  </span>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Checkout Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} {customization.brandName || 'Pay Yetux'}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
