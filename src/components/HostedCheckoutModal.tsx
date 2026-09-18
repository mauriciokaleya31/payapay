import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lock, 
  Zap, 
  Printer, 
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Download,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { PaymentLink, Product, Charge, PaymentMethodType } from '../types';
import { api } from '../services/api';

interface HostedCheckoutModalProps {
  item: PaymentLink | Product | null;
  onClose: () => void;
  onPaymentSuccess: (charge: Charge) => void;
  onOpenCustomerPortal?: (user: any) => void;
}

export const HostedCheckoutModal: React.FC<HostedCheckoutModalProps> = ({
  item,
  onClose,
  onPaymentSuccess,
  onOpenCustomerPortal,
}) => {
  if (!item) return null;

  const [method, setMethod] = useState<PaymentMethodType>('GPO');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('guest_customer_name') || '');
  const [customerEmail, setCustomerEmail] = useState(() => localStorage.getItem('guest_customer_email') || '');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('guest_customer_phone') || '');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [createdCharge, setCreatedCharge] = useState<Charge | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60); // 1 minuto (60 segundos)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const amount = item.price !== undefined ? item.price : (item as PaymentLink).amount;
  const title = (item as any).name || (item as any).title;
  const description = item.description || '';
  const imageUrl = item.imageUrl;

  // Poll status while pending GPO every 2.5 seconds
  useEffect(() => {
    let interval: any;
    if (createdCharge && createdCharge.status === 'pending' && !isPaid) {
      interval = setInterval(async () => {
        try {
          const fresh = await api.getCharge(createdCharge.id);
          if (fresh && fresh.status === 'paid') {
            setCreatedCharge(fresh);
            setIsPaid(true);
            onPaymentSuccess(fresh);
          }
        } catch {
          // ignore transient polling error
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [createdCharge, isPaid, onPaymentSuccess]);

  // Countdown timer for push payment
  useEffect(() => {
    let timer: any;
    if (createdCharge && createdCharge.status === 'pending' && !isPaid && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [createdCharge, isPaid, countdown]);

  const handleCheckLiveStatus = async () => {
    if (!createdCharge) return;
    setIsCheckingSync(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/charges/${createdCharge.id}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.charge) {
        setCreatedCharge(data.charge);
        if (data.charge.status === 'paid') {
          setIsPaid(true);
          onPaymentSuccess(data.charge);
        } else {
          setErrorMessage('O pagamento ainda não foi concluído no seu telemóvel. Por favor confirme no app Multicaixa Express.');
        }
      }
    } catch {
      setErrorMessage('Não foi possível sincronizar no momento. Tente novamente em alguns segundos.');
    } finally {
      setIsCheckingSync(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    // Save guest inputs for next time
    localStorage.setItem('guest_customer_name', customerName);
    localStorage.setItem('guest_customer_email', customerEmail);
    localStorage.setItem('guest_customer_phone', phoneNumber);

    try {
      const res = await api.createCharge({
        amount,
        method,
        phoneNumber: method === 'GPO' ? phoneNumber : undefined,
        description: `Compra: ${title}`,
        customerName: customerName || 'Cliente Convidado',
        customerEmail: customerEmail || undefined,
        paymentLinkId: (item as any).slug ? (item as any).id : undefined,
        productId: (item as any).price ? (item as any).id : undefined,
      });

      setCreatedCharge(res.charge);
      if (res.charge.status === 'paid') {
        setIsPaid(true);
        onPaymentSuccess(res.charge);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePinApproval = async () => {
    if (!createdCharge) return;
    try {
      const updated = await api.simulatePayment(createdCharge.id);
      setCreatedCharge(updated);
      setIsPaid(true);
      onPaymentSuccess(updated);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const custAccount = (createdCharge as any)?.customerAccount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Checkout Top Bar */}
        <div className="bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Pagamento Seguro
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Order Summary Ribbon */}
        <div className="bg-blue-50/70 p-4 sm:p-5 border-b border-blue-100 flex items-center space-x-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-16 h-16 rounded-xl object-cover border border-blue-200 shadow-2xs shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
            <p className="text-xs text-slate-600 truncate">{description || 'Transação direta sem necessidade de conta prévia'}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500">Valor a Pagar</div>
            <div className="text-lg font-black text-blue-900">{formatKz(amount)}</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {isPaid ? (
            /* Success Receipt Screen */
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Pagamento Confirmado com Sucesso!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  A sua transação foi processada e validada pela rede interbancária.
                </p>
              </div>

              {/* Automatic Customer Account Alert */}
              {custAccount && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-left space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Conta de Cliente Criada Automaticamente!</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      Acesso Imediato
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800">
                    Criámos a sua <strong>Área de Cliente</strong> para consultar o histórico das suas compras, emitir faturas oficiais e descarregar ficheiros:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold">E-mail de Acesso:</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {custAccount.user?.email || customerEmail}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 block font-semibold">Palavra-passe Temporária:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(custAccount.temporaryPassword || 'Cliente#2026', 'temp_pass')}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
                        >
                          {copiedField === 'temp_pass' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="font-mono font-black text-emerald-700 text-sm block">
                        {custAccount.temporaryPassword || 'Cliente#2026'}
                      </span>
                    </div>
                  </div>

                  {onOpenCustomerPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCustomerPortal(custAccount.user);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Entrar Agora na Minha Área de Clientes</span>
                    </button>
                  )}
                </div>
              )}

              {/* Receipt card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left border border-slate-200 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200 pb-2 font-bold text-slate-800">
                  <span>Recibo de Pagamento</span>
                  <span className="text-emerald-700 font-extrabold">APROVADO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID da Transação:</span>
                  <span className="font-mono font-semibold text-slate-900">{createdCharge?.merchantTransactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montante Pago:</span>
                  <span className="font-bold text-slate-900">{formatKz(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método:</span>
                  <span className="font-semibold text-slate-900">
                    {createdCharge?.method === 'GPO' ? 'Multicaixa Express (GPO)' : 'Referência Bancária (GPR)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-semibold text-slate-900">{customerName || 'Consumidor Final'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data e Hora:</span>
                  <span className="text-slate-900">
                    {new Date(createdCharge?.paidAt || Date.now()).toLocaleString('pt-PT')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Recibo</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : createdCharge && createdCharge.status === 'pending' ? (
            /* Pending Charge Screen */
            <div className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {createdCharge.method === 'GPO' ? (
                /* GPO Pending - Push Notification */
                <div className="space-y-4 text-center">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"></span>
                    <div className="relative w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Smartphone className="w-8 h-8 animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">Aprovação Multicaixa Express</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Enviámos uma notificação push para o telemóvel <strong>+244 {phoneNumber}</strong>. Abra a aplicação Multicaixa Express e insira o seu PIN para confirmar.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center space-x-2 text-xs text-amber-800 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Tempo restante para aprovação: <strong>{formatTime(countdown)}</strong></span>
                  </div>

                  {/* Manual Status Check Button */}
                  <button
                    type="button"
                    onClick={handleCheckLiveStatus}
                    disabled={isCheckingSync}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingSync ? 'animate-spin' : ''}`} />
                    <span>
                      {isCheckingSync
                        ? 'A verificar no Multicaixa Express...'
                        : 'Já Confirmei no Telemóvel (Verificar Pagamento Agora)'}
                    </span>
                  </button>
                </div>
              ) : (
                /* GPR Pending - Referência Bancária Details */
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white mx-auto flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Dados para Pagamento por Referência</h4>
                    <p className="text-xs text-slate-600">
                      Pague no Multicaixa ATM, Internet Banking ou App do seu Banco em Angola
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Entidade:</div>
                        <div className="font-mono text-lg font-black text-slate-900">
                          {createdCharge.referenceDetails?.entity || (createdCharge as any).referenceEntity || '10111'}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Referência:</div>
                        <div className="font-mono text-lg font-black text-blue-700">
                          {createdCharge.referenceDetails?.reference || (createdCharge as any).referenceNumber || '---'}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Montante:</div>
                        <div className="font-bold text-base text-slate-900">
                          {formatKz(createdCharge.amount)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Validade:</div>
                        <div className="text-xs font-bold text-slate-800">
                          {createdCharge.referenceDetails?.expiryDate 
                            ? new Date(createdCharge.referenceDetails.expiryDate).toLocaleDateString('pt-PT') 
                            : '48 Horas'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const ent = createdCharge.referenceDetails?.entity || (createdCharge as any).referenceEntity || '10111';
                        const ref = createdCharge.referenceDetails?.reference || (createdCharge as any).referenceNumber || '---';
                        const str = `Entidade: ${ent}\nReferência: ${ref}\nMontante: ${formatKz(amount)}`;
                        copyToClipboard(str, 'all_ref');
                      }}
                      className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      {copiedField === 'all_ref' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Dados Copiados com Sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Dados de Pagamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCreatedCharge(null)}
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Escolher outro método</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleCreateCharge} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Guest Checkout Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Compra Livre:</strong> Não precisa ter conta previamente. Uma conta de cliente será criada automaticamente para descarregar recibos e ficheiros.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Selecione o Método de Pagamento:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('GPO')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      method === 'GPO'
                        ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-2 ring-blue-600/30'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className={`w-5 h-5 ${method === 'GPO' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        Instantâneo
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-2">Multicaixa Express</div>
                    <div className="text-[11px] text-slate-600">Notificação push no telemóvel</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('GPR')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      method === 'GPR'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className={`w-5 h-5 ${method === 'GPR' ? 'text-white' : 'text-slate-500'}`} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${method === 'GPR' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                        ATM / IB
                      </span>
                    </div>
                    <div className={`font-bold text-xs mt-2 ${method === 'GPR' ? 'text-white' : 'text-slate-900'}`}>
                      Referência Bancária
                    </div>
                    <div className={`text-[11px] ${method === 'GPR' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Pague no ATM ou App do Banco
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Manuel António"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Email para Fatura & Conta *</label>
                    <input
                      type="email"
                      required
                      placeholder="cliente@exemplo.ao"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {method === 'GPO' && (
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Número Multicaixa Express (Angola) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex items-center space-x-1 text-xs font-bold text-slate-700">
                        <span>🇦🇴</span>
                        <span>+244</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="923 456 789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-20 pr-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <span className="text-[11px] text-slate-600 mt-1 block">
                      Receberá um pedido de autorização com PIN no seu aplicativo Multicaixa Express.
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'A comunicar com a rede...'
                      : method === 'GPO'
                      ? `Pagar ${formatKz(amount)} com MCX Express`
                      : `Gerar Referência para ${formatKz(amount)}`}
                  </span>
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-500 pt-1">
                Ao clicar em pagar, a sua transação é processada em conformidade com as normas interbancárias de Angola.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
