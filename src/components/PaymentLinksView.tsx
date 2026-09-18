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
  Palette,
  FileDown,
  X
} from 'lucide-react';
import { PaymentLink, PaymentMethodType } from '../types';

interface PaymentLinksViewProps {
  links: PaymentLink[];
  onCreateLink: (payload: Partial<PaymentLink>) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onOpenCheckout: (link: PaymentLink) => void;
  onCustomizeCheckout?: (link: PaymentLink) => void;
}

export const PaymentLinksView: React.FC<PaymentLinksViewProps> = ({
  links,
  onCreateLink,
  onDeleteLink,
  onOpenCheckout,
  onCustomizeCheckout,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
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
    const url = `${origin}/?checkout=${link.slug}`;
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
        digitalFileUrl: digitalFileUrl.trim() || undefined,
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
    setDigitalFileUrl('');
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Links de Pagamento & Checkout</h2>
          <p className="text-xs text-slate-500">
            Crie links partilháveis para vender os seus infoprodutos via Multicaixa Express e Referência Bancária
          </p>
        </div>

        <button
          id="btn-criar-link"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
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

                {link.digitalFileUrl && (
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <FileDown className="w-3 h-3" />
                    Infoproduto
                  </div>
                )}
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                    ?checkout={link.slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(link)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                    title="Copiar Link Direto"
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
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                <span>Vendas: <strong className="text-slate-800">{link.totalSalesCount}</strong></span>
                <span className="mx-1.5">•</span>
                <span>Total: <strong className="text-emerald-700 font-semibold">{formatKz(link.totalSalesAmount)}</strong></span>
              </div>

              <div className="flex items-center space-x-1.5">
                {onCustomizeCheckout && (
                  <button
                    onClick={() => onCustomizeCheckout(link)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-300"
                    title="Personalizar visual do checkout"
                  >
                    <Palette className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personalizar</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenCheckout(link)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Abrir</span>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Novo Link de Infoproduto / Checkout</h3>
                <p className="text-xs text-slate-500">Gere um link seguro com entrega digital para os seus compradores</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nome do Infoproduto ou Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: E-book de Finanças Pessoais, Curso de Marketing, Mentoria VIP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Preço em Kwanzas (AOA) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Kz</span>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Breve resumo do que o comprador vai receber..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">URL do Arquivo Digital / Infoproduto (Download Automático)</label>
                <input
                  type="url"
                  placeholder="https://meus-arquivos.com/ebook-seguro.pdf ou link do Drive"
                  value={digitalFileUrl}
                  onChange={(e) => setDigitalFileUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  O cliente recebe este link após o pagamento aprovado no Multicaixa.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">URL da Imagem de Capa (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
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
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Multicaixa Express</span>
                    </div>
                    {allowedMethods.includes('GPO') && <Check className="w-4 h-4 text-emerald-600" />}
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'A criar...' : 'Salvar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
