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
  FileText,
  X,
  RefreshCw,
  Mail,
  Phone,
  UserCheck,
  Building
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
    brandName: 'Pay Yetux Vendas',
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
  const sellerEmail = (item as any).sellerEmail || (item as any).userEmail || customization.supportEmail || 'suporte@vendedor.ao';
  const sellerPhone = (item as any).sellerPhone || customization.supportPhone || '+244 923 456 789';

  // Buyer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('GPO');

  // Checkout Steps: 'form' | 'processing' | 'awaiting_payment' | 'paid' | 'failed'
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'awaiting_payment' | 'paid' | 'failed'>('form');
  const [charge, setCharge] = useState<Charge | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isVerifyingNow, setIsVerifyingNow] = useState(false);

  // 1-minute (60 seconds) Push Authorization Countdown Timer
  const [pushCountdown, setPushCountdown] = useState(60);

  // Scarcity Countdown Timer (Header)
  const [timeLeft, setTimeLeft] = useState((customization.countdownMinutes || 15) * 60);

  useEffect(() => {
    if (!customization.showCountdown) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [customization.showCountdown]);

  // 1-minute countdown specifically for Multicaixa Express authorization
  useEffect(() => {
    let timer: any;
    if (checkoutStep === 'awaiting_payment' && charge?.method === 'GPO' && pushCountdown > 0) {
      timer = setInterval(() => {
        setPushCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutStep, charge?.method, pushCountdown]);

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
      setErrorMessage('O seu e-mail é obrigatório para enviarmos as credenciais de login e a fatura.');
      return;
    }

    if (selectedMethod === 'GPO' && !customerPhone.trim()) {
      setErrorMessage('Informe o número de telemóvel associado ao Multicaixa Express.');
      return;
    }

    setCheckoutStep('processing');
    setErrorMessage(null);
    setPushCountdown(60);

    try {
      const res = await api.createCharge({
        amount,
        method: selectedMethod,
        phoneNumber: customerPhone.trim(),
        description: `Compra: ${title}`,
        customerName: customerName.trim() || 'Cliente',
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
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [checkoutStep, charge, onPaymentSuccess]);

  // Manual Instant Verification
  const handleVerifyStatusNow = async () => {
    if (!charge) return;
    setIsVerifyingNow(true);
    setErrorMessage(null);
    try {
      const updated = await api.syncChargeStatus(charge.id);
      setCharge(updated);
      if (updated.status === 'paid') {
        setCheckoutStep('paid');
        if (onPaymentSuccess) onPaymentSuccess(updated);
      } else {
        setErrorMessage('O pagamento ainda aguarda confirmação no Multicaixa Express. Por favor confirme a autorização no telemóvel.');
      }
    } catch {
      setErrorMessage('Não foi possível verificar no momento. Tente novamente em alguns segundos.');
    } finally {
      setIsVerifyingNow(false);
    }
  };

  const handleCopyGpr = () => {
    if (!charge) return;
    const entity = charge.referenceDetails?.entity || (charge as any).referenceEntity || '10111';
    const reference = charge.referenceDetails?.reference || (charge as any).referenceNumber || '---';
    const text = `Entidade: ${entity} | Ref: ${reference} | Valor: ${formatKz(charge.amount)}`;
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
        <title>Recibo Oficial #${charge.merchantTransactionId || charge.id.substring(0, 8)}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .receipt-box { max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: bold; color: #059669; }
          .badge-paid { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 99px; font-weight: bold; font-size: 12px; display: inline-block; }
          .details { margin: 20px 0; font-size: 13px; line-height: 1.6; }
          .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 20px; padding-top: 12px; border-top: 2px solid #0f172a; }
          .footer { margin-top: 32px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="brand">${customization.brandName || 'Pay Yetux'}</div>
              <div style="font-size: 12px; color: #64748b;">Comprovativo de Pagamento Seguro</div>
            </div>
            <div style="text-align: right;">
              <span class="badge-paid">PAGAMENTO CONFIRMADO</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Data: ${new Date(charge.paidAt || charge.createdAt).toLocaleString('pt-AO')}</div>
            </div>
          </div>
          <div class="details">
            <p><strong>Recibo Nº:</strong> FT-${charge.id.substring(4, 12).toUpperCase()}</p>
            <p><strong>Cliente:</strong> ${customerName || charge.customerName || 'Cliente'}</p>
            <p><strong>E-mail:</strong> ${customerEmail || charge.customerEmail}</p>
            <p><strong>Método:</strong> ${charge.method === 'GPO' ? 'Multicaixa Express' : 'Referência Multicaixa (GPR)'}</p>
          </div>
          <div class="item-row">
            <span>${title}</span>
            <span>${formatKz(charge.amount)}</span>
          </div>
          <div class="total">
            <span>Total Liquidado:</span>
            <span style="color: #059669;">${formatKz(charge.amount)}</span>
          </div>
          <div class="footer">
            Os dados de acesso ao seu painel foram enviados para o seu e-mail.
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
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {customization.logoUrl ? (
              <img 
                src={customization.logoUrl} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                style={{ backgroundColor: customization.brandColor || '#059669' }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                {customization.brandName || 'Pay Yetux Vendas'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Countdown Scarcity Header */}
            {customization.showCountdown && checkoutStep === 'form' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Expira em: <strong>{formatTimer(timeLeft)}</strong></span>
              </div>
            )}

            {/* Close Button */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors shadow-xs"
                title="Fechar checkout"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-8 flex-1">
        {checkoutStep === 'paid' ? (
          /* ================= COMPLETE THANK YOU PAGE (PÁGINA DE OBRIGADO) ================= */
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-8 text-center max-w-xl mx-auto shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">Obrigado pela sua compra!</h2>
            <p className="text-sm text-emerald-400 font-semibold mt-1">
              O seu pagamento de <strong className="text-white">{formatKz(amount)}</strong> foi confirmado com sucesso.
            </p>

            {/* Account & Email Notice Box */}
            <div className="mt-6 bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Credenciais Enviadas por E-mail</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enviámos os dados de login e recibo para: <strong className="text-white underline break-all">{customerEmail || charge?.customerEmail}</strong>.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-start sm:items-center gap-2 text-slate-400 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>A sua conta foi ativada. Já pode aceder ao seu painel para consultar as suas compras.</span>
              </div>
            </div>

            {/* Seller Contact Info Box */}
            <div className="mt-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-left space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Contacto do Vendedor</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para dúvidas ou suporte pós-venda, contacte diretamente o vendedor:
              </p>
              <div className="pt-1 flex flex-col sm:flex-row flex-wrap gap-2 text-xs text-slate-300">
                {sellerEmail && (
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{sellerEmail}</span>
                  </div>
                )}
                {sellerPhone && (
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-[11px]">{sellerPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              {digitalFileUrl && (
                <a
                  href={digitalFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descarregar Conteúdo</span>
                </a>
              )}

              {onOpenCustomerPortal && (
                <button
                  onClick={onOpenCustomerPortal}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Aceder ao Painel de Cliente</span>
                </button>
              )}

              <button
                onClick={handleDownloadInvoice}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Descarregar Recibo em PDF</span>
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Fechar e Concluir
                </button>
              )}
            </div>
          </div>
        ) : checkoutStep === 'awaiting_payment' && charge ? (
          /* ================= AWAITING PAYMENT STATE ================= */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 max-w-lg mx-auto shadow-2xl text-center animate-fadeIn">
            {charge.method === 'GPO' ? (
              <div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white">Confirme no seu Telemóvel</h2>
                <p className="text-xs text-slate-300 mt-1.5">
                  Uma notificação de autorização push foi enviada para o telemóvel <strong>{charge.phoneNumber}</strong>.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Abra o aplicativo Multicaixa Express e digite o seu PIN para aprovar o montante de <strong className="text-emerald-400">{formatKz(charge.amount)}</strong>.
                </p>

                {/* 1-Minute Countdown Timer */}
                <div className="my-5 p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Tempo para confirmação:</span>
                  </div>
                  <span className="font-mono text-base font-bold text-amber-400">
                    {formatTimer(pushCountdown)}
                  </span>
                </div>

                {pushCountdown === 0 && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs text-left flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>O tempo de 1 minuto expirou. Se já autorizou no telemóvel, clique no botão de verificação abaixo. Caso contrário, tente novamente.</span>
                  </div>
                )}

                {/* Verification Status & Manual Button */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleVerifyStatusNow}
                    disabled={isVerifyingNow}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isVerifyingNow ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingNow ? 'A verificar pagamento...' : 'Verificar Pagamento Agora'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('form');
                      setPushCountdown(60);
                    }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Alterar número de telemóvel ou método
                  </button>

                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white">Referência de Pagamento Gerada</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Efetue o pagamento no ATM Multicaixa ou no seu Internet Banking:
                </p>

                {/* Reference Details Box */}
                <div className="my-5 p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Entidade:</span>
                    <strong className="text-white font-mono text-base tracking-wider">
                      {charge.referenceDetails?.entity || (charge as any).referenceEntity || '10111'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Referência:</span>
                    <strong className="text-emerald-400 font-mono text-lg tracking-wider">
                      {charge.referenceDetails?.reference || (charge as any).referenceNumber || '---'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Montante:</span>
                    <strong className="text-white text-sm">{formatKz(charge.amount)}</strong>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleCopyGpr}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedRef ? 'Dados Copiados!' : 'Copiar Dados de Pagamento'}
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyStatusNow}
                    disabled={isVerifyingNow}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isVerifyingNow ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingNow ? 'A verificar pagamento...' : 'Verificar Pagamento Agora'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep('form')}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Voltar e escolher outro método
                  </button>

                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= MAIN CHECKOUT FORM ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Product Summary & Guarantee */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="aspect-video w-full rounded-xl overflow-hidden mb-3.5 bg-slate-800 relative">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-400 border border-slate-700">
                    {formatKz(amount)}
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">{title}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">{description}</p>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total a Pagar:</span>
                  <span className="text-lg sm:text-xl font-extrabold text-emerald-400">{formatKz(amount)}</span>
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
                      {customization.guaranteeText || 'Se não ficar satisfeito com o infoproduto, garantimos devolução integral do seu dinheiro.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Testimonials */}
              {customization.showTestimonials && customization.testimonials && customization.testimonials.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Avaliações de Clientes</h4>
                  {customization.testimonials.slice(0, 2).map((t, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-300 italic mb-1 break-words">&ldquo;{t.comment}&rdquo;</p>
                      <span className="font-bold text-white text-[11px]">{t.author}</span>
                      {t.role && <span className="text-slate-500 text-[10px] ml-1.5">&bull; {t.role}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Buyer Data & Payment Method */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
              <div className="mb-5 pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Dados do Comprador</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Preencha os seus dados. O acesso ao produto e sua fatura serão enviados para o seu e-mail.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-words">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Manuel António"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    E-mail para Recebimento do Acesso
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="seu.email@exemplo.ao"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    As suas credenciais de acesso ao painel de cliente serão enviadas para este e-mail.
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Escolha o Método de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('GPO')}
                      className={`p-3 sm:p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] sm:min-h-[76px] ${
                        selectedMethod === 'GPO'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Smartphone className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMethod === 'GPO' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {selectedMethod === 'GPO' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">MCX Express</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Push no Telemóvel</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('GPR')}
                      className={`p-3 sm:p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] sm:min-h-[76px] ${
                        selectedMethod === 'GPR'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <CreditCard className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMethod === 'GPR' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {selectedMethod === 'GPR' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">Referência GPR</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">ATM / Internet Banking</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Multicaixa Express Phone Input */}
                {selectedMethod === 'GPO' && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Número de Telemóvel Multicaixa Express
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Receberá uma notificação push no seu telemóvel para autorizar com o PIN.
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
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>A gerar pagamento...</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">{customization.buttonText || 'Pagar Agora'}</span>
                        <span className="shrink-0 font-extrabold">&bull; {formatKz(amount)}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 text-center">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pagamento Oficial Seguro</span>
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
