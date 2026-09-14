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
  AlertCircle
} from 'lucide-react';
import { PaymentLink, Product, Charge, PaymentMethodType } from '../types';
import { api } from '../services/api';

interface HostedCheckoutModalProps {
  item: PaymentLink | Product | null;
  onClose: () => void;
  onPaymentSuccess: (charge: Charge) => void;
}

export const HostedCheckoutModal: React.FC<HostedCheckoutModalProps> = ({
  item,
  onClose,
  onPaymentSuccess,
}) => {
  if (!item) return null;

  const [method, setMethod] = useState<PaymentMethodType>('GPO');
  const [customerName, setCustomerName] = useState('Valdemar Manuel');
  const [customerEmail, setCustomerEmail] = useState('valdemar@exemplo.ao');
  const [phoneNumber, setPhoneNumber] = useState('923456789');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdCharge, setCreatedCharge] = useState<Charge | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes
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

  // Poll status while pending GPO
  useEffect(() => {
    let interval: any;
    if (createdCharge && createdCharge.status === 'pending' && !isPaid) {
      interval = setInterval(async () => {
        try {
          const fresh = await api.getCharge(createdCharge.id);
          if (fresh.status === 'paid') {
            setCreatedCharge(fresh);
            setIsPaid(true);
            onPaymentSuccess(fresh);
          }
        } catch (err) {
          // ignore transient polling error
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [createdCharge, isPaid]);

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

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await api.createCharge({
        amount,
        method,
        phoneNumber: method === 'GPO' ? phoneNumber : undefined,
        description: `Compra: ${title}`,
        customerName,
        customerEmail,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Checkout Top Bar */}
        <div className="bg-slate-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Checkout Seguro</div>
              <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>Nuvex Gateway</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  256-bit SSL
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Ribbon */}
        <div className="bg-blue-50/60 p-4 sm:p-5 border-b border-blue-100 flex items-center space-x-4">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-16 h-16 rounded-xl object-cover border border-blue-200 shadow-2xs"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
            <p className="text-xs text-slate-500 truncate">{description || 'Transação direta'}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Valor Total</div>
            <div className="text-lg font-black text-blue-900">{formatKz(amount)}</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {isPaid ? (
            /* Success Receipt Screen */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Pagamento Confirmado com Sucesso!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  A sua transacção foi processada e aprovada através da rede Nuvex.
                </p>
              </div>

              {/* Receipt card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left border border-slate-200 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200 pb-2 font-bold text-slate-800">
                  <span>Recibo de Pagamento</span>
                  <span className="text-emerald-700">APROVADO</span>
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
                  <span className="font-semibold text-slate-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data e Hora:</span>
                  <span className="text-slate-900">
                    {new Date(createdCharge?.paidAt || Date.now()).toLocaleString('pt-PT')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Recibo</span>
                </button>
                <button
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
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Enviámos uma notificação push para o telemóvel <strong>+244 {phoneNumber}</strong>. Abra a aplicação Multicaixa Express e insira o seu PIN para confirmar.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center space-x-2 text-xs text-amber-800 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Tempo restante para aprovação: <strong>{formatTime(countdown)}</strong></span>
                  </div>

                  {/* Simulator button */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[11px] text-slate-500 block">
                      Ambiente de Teste / Demonstração:
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulatePinApproval}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-2xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Simular Aprovação do PIN no Telemóvel</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* GPR Pending - Referência Bancária Details */
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white mx-auto flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Dados para Pagamento por Referência</h4>
                    <p className="text-xs text-slate-500">
                      Pague no Multicaixa ATM, Internet Banking ou App do seu Banco em Angola
                    </p>
                  </div>

                  {createdCharge.referenceDetails && (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[11px] text-slate-500">Entidade:</div>
                          <div className="font-mono text-lg font-bold text-slate-900">
                            {createdCharge.referenceDetails.entity}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[11px] text-slate-500">Referência:</div>
                          <div className="font-mono text-lg font-bold text-blue-700">
                            {createdCharge.referenceDetails.reference}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[11px] text-slate-500">Montante:</div>
                          <div className="font-bold text-base text-slate-900">
                            {formatKz(createdCharge.referenceDetails.amount)}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-[11px] text-slate-500">Validade:</div>
                          <div className="text-xs font-semibold text-slate-800">
                            {new Date(createdCharge.referenceDetails.expiryDate).toLocaleDateString('pt-PT')}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const str = `Entidade: ${createdCharge.referenceDetails?.entity}\nReferência: ${createdCharge.referenceDetails?.reference}\nMontante: ${formatKz(amount)}`;
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
                  )}

                  {/* Simulator for Reference Payment */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500">Já efetuou o pagamento no ATM/Banco?</span>
                    <button
                      onClick={handleSimulatePinApproval}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-2xs"
                    >
                      Confirmar Pagamento
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCreatedCharge(null)}
                  className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
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

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Selecione o Método de Pagamento:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('GPO')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      method === 'GPO'
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className={`w-5 h-5 ${method === 'GPO' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        Instantâneo
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-2">Multicaixa Express</div>
                    <div className="text-[11px] text-slate-500">Notificação push no telemóvel</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('GPR')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      method === 'GPR'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className={`w-5 h-5 ${method === 'GPR' ? 'text-white' : 'text-slate-400'}`} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${method === 'GPR' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                        ATM / IB
                      </span>
                    </div>
                    <div className={`font-bold text-xs mt-2 ${method === 'GPR' ? 'text-white' : 'text-slate-900'}`}>
                      Referência de Pagamento
                    </div>
                    <div className={`text-[11px] ${method === 'GPR' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Pague no ATM ou App Bancária
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome completo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email para Recibo</label>
                    <input
                      type="email"
                      placeholder="email@exemplo.ao"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                {method === 'GPO' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Número Multicaixa Express (Angola) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex items-center space-x-1 text-xs font-bold text-slate-600">
                        <span>🇦🇴</span>
                        <span>+244</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="923 456 789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-20 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono font-bold text-slate-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Receberá uma mensagem de confirmação instantânea no seu telemóvel.
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Processando...'
                      : method === 'GPO'
                      ? `Pagar ${formatKz(amount)} com MCX Express`
                      : `Gerar Referência para ${formatKz(amount)}`}
                  </span>
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-400 pt-1">
                Ao clicar em pagar, os dados serão validados pela rede interbancária de Angola.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
