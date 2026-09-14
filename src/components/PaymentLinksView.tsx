import React, { useState } from 'react';
import { 
  Plus, 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  DollarSign,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { PaymentLink, PaymentMethodType } from '../types';

interface PaymentLinksViewProps {
  links: PaymentLink[];
  onCreateLink: (payload: Partial<PaymentLink>) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onOpenCheckout: (link: PaymentLink) => void;
}

export const PaymentLinksView: React.FC<PaymentLinksViewProps> = ({
  links,
  onCreateLink,
  onDeleteLink,
  onOpenCheckout,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [allowedMethods, setAllowedMethods] = useState<PaymentMethodType[]>(['GPO', 'GPR']);
  const [requiresName, setRequiresName] = useState(true);
  const [requiresEmail, setRequiresEmail] = useState(true);
  const [requiresPhone, setRequiresPhone] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const handleCopyLink = (link: PaymentLink) => {
    const origin = window.location.origin;
    const url = `${origin}/pay/${link.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(link.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setIsSubmitting(true);
    try {
      await onCreateLink({
        title,
        description,
        amount: Number(amount),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
        allowedMethods,
        requiresCustomerName: requiresName,
        requiresCustomerEmail: requiresEmail,
        requiresCustomerPhone: requiresPhone,
      });
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setImageUrl('');
    setAllowedMethods(['GPO', 'GPR']);
  };

  const toggleMethod = (m: PaymentMethodType) => {
    if (allowedMethods.includes(m)) {
      if (allowedMethods.length === 1) return; // keep at least one
      setAllowedMethods(allowedMethods.filter((item) => item !== m));
    } else {
      setAllowedMethods([...allowedMethods, m]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Links de Pagamento</h2>
          <p className="text-xs text-slate-500">Crie links partilháveis para receber pagamentos via WhatsApp, Redes Sociais ou Email</p>
        </div>

        <button
          id="btn-criar-link"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Link</span>
        </button>
      </div>

      {/* Grid of Payment Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {links.map((link) => (
          <div
            key={link.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Image banner */}
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={link.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'}
                  alt={link.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold">
                  {formatKz(link.amount)}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{link.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {link.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Methods badges */}
                <div className="flex items-center gap-1.5 pt-1">
                  {link.allowedMethods.includes('GPO') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <Smartphone className="w-3 h-3 mr-1" />
                      MCX Express
                    </span>
                  )}
                  {link.allowedMethods.includes('GPR') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Referência
                    </span>
                  )}
                </div>

                {/* Link URL pill */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 truncate mr-2">
                    /pay/{link.slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(link)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                    title="Copiar URL"
                  >
                    {copiedLinkId === link.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Stats & Actions */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span>Vendas: <strong className="text-slate-800">{link.totalSalesCount}</strong></span>
                <span className="mx-1.5">•</span>
                <span>Total: <strong className="text-emerald-700 font-semibold">{formatKz(link.totalSalesAmount)}</strong></span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onOpenCheckout(link)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Abrir Checkout</span>
                </button>
                <button
                  onClick={() => onDeleteLink(link.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Novo Link de Pagamento</h3>
                <p className="text-xs text-slate-500">Gere um checkout seguro para qualquer produto ou serviço</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Produto ou Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultoria Tech, Inscrição Workshop, Licença de Software"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preço em Kwanzas (AOA) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Kz</span>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Breve resumo do que o cliente está a adquirir..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Métodos Permitidos</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMethod('GPO')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      allowedMethods.includes('GPO')
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>Multicaixa Express</span>
                    </div>
                    {allowedMethods.includes('GPO') && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleMethod('GPR')}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      allowedMethods.includes('GPR')
                        ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Referência ATM/IB</span>
                    </div>
                    {allowedMethods.includes('GPR') && <Check className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmitting ? 'Gerando Link...' : 'Criar Link de Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
