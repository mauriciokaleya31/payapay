import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Check, 
  Clock, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Eye, 
  Plus, 
  Trash2, 
  Smartphone, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { PaymentLink, Product, CheckoutCustomization, CheckoutTestimonial } from '../types';

interface CheckoutCustomizerModalProps {
  item: PaymentLink | Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customization: CheckoutCustomization) => Promise<void>;
}

const COLOR_PRESETS = [
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Azul Real', hex: '#2563eb' },
  { name: 'Índigo VIP', hex: '#4f46e5' },
  { name: 'Roxo Criativo', hex: '#7c3aed' },
  { name: 'Rubi Intenso', hex: '#e11d48' },
  { name: 'Âmbar Dourado', hex: '#d97706' },
  { name: 'Grafite Dark', hex: '#0f172a' },
];

export const CheckoutCustomizerModal: React.FC<CheckoutCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const initialCustomization: CheckoutCustomization = item.customization || {
    brandName: 'Minha Marca Digital',
    brandColor: '#059669',
    buttonText: 'Garantir Acesso Imediato',
    guaranteeBadge: true,
    guaranteeDays: 7,
    guaranteeText: 'Garantia incondicional de 7 dias com devolução total do dinheiro.',
    showCountdown: true,
    countdownMinutes: 15,
    showTestimonials: true,
    testimonials: [
      {
        author: 'Edvaldo Santos',
        comment: 'O material mudou a minha perspetiva. Paguei no Multicaixa Express e em 3 segundos já tinha o link no e-mail!',
        rating: 5,
        role: 'Empreendedor em Luanda',
      },
    ],
  };

  const [brandName, setBrandName] = useState(initialCustomization.brandName || '');
  const [logoUrl, setLogoUrl] = useState(initialCustomization.logoUrl || '');
  const [brandColor, setBrandColor] = useState(initialCustomization.brandColor || '#059669');
  const [buttonText, setButtonText] = useState(initialCustomization.buttonText || 'Garantir Acesso Imediato');
  const [guaranteeBadge, setGuaranteeBadge] = useState(initialCustomization.guaranteeBadge ?? true);
  const [guaranteeDays, setGuaranteeDays] = useState(initialCustomization.guaranteeDays || 7);
  const [guaranteeText, setGuaranteeText] = useState(initialCustomization.guaranteeText || '');
  const [showCountdown, setShowCountdown] = useState(initialCustomization.showCountdown ?? true);
  const [countdownMinutes, setCountdownMinutes] = useState(initialCustomization.countdownMinutes || 15);
  const [showTestimonials, setShowTestimonials] = useState(initialCustomization.showTestimonials ?? true);
  const [testimonials, setTestimonials] = useState<CheckoutTestimonial[]>(initialCustomization.testimonials || []);

  // New testimonial input state
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newRole, setNewRole] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleAddTestimonial = () => {
    if (!newAuthor.trim() || !newComment.trim()) return;
    setTestimonials([
      ...testimonials,
      { author: newAuthor.trim(), comment: newComment.trim(), rating: 5, role: newRole.trim() || undefined },
    ]);
    setNewAuthor('');
    setNewComment('');
    setNewRole('');
  };

  const handleRemoveTestimonial = (idx: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        brandName,
        logoUrl: logoUrl.trim() || undefined,
        brandColor,
        buttonText,
        guaranteeBadge,
        guaranteeDays: Number(guaranteeDays),
        guaranteeText,
        showCountdown,
        countdownMinutes: Number(countdownMinutes),
        showTestimonials,
        testimonials,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isProduct = 'category' in item;
  const itemTitle = isProduct ? (item as Product).name : (item as PaymentLink).title;
  const itemPrice = item.price !== undefined ? item.price : (item as PaymentLink).amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Personalizar Meu Checkout</h3>
              <p className="text-xs text-slate-400">
                Ajuste cores, logótipo, gatilhos de urgência e depoimentos para o produto: <strong>{itemTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 2 Columns (Settings & Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Settings Column */}
          <div className="lg:col-span-6 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Brand Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">1. Marca & Identidade Visual</h4>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome da Marca ou Produtor</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Academia Digital Angola"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">URL do Logótipo (Imagem)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/meu-logo.png"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Cor Principal do Checkout</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBrandColor(c.hex)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {brandColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white font-mono w-28 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Scarcity / Countdown */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">2. Gatilho de Urgência (Contador)</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={(e) => setShowCountdown(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {showCountdown && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duração do Contador (Minutos)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={countdownMinutes}
                    onChange={(e) => setCountdownMinutes(Number(e.target.value))}
                    className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Guarantee Badge */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">3. Selo de Garantia</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guaranteeBadge}
                    onChange={(e) => setGuaranteeBadge(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {guaranteeBadge && (
                <div className="space-y-2">
                  <div className="flex gap-3">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setGuaranteeDays(days)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                          guaranteeDays === days
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {days} Dias
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Texto da Garantia</label>
                    <textarea
                      rows={2}
                      value={guaranteeText}
                      onChange={(e) => setGuaranteeText(e.target.value)}
                      placeholder="Explique os termos da garantia incondicional..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Button Call to Action */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">4. Texto do Botão de Pagamento</h4>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Ex: Garantir Vaga Agora, Pagar com Multicaixa"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Testimonials */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">5. Depoimentos de Clientes</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTestimonials}
                    onChange={(e) => setShowTestimonials(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {showTestimonials && (
                <div className="space-y-3">
                  {testimonials.map((t, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-start gap-2">
                      <div className="text-xs">
                        <p className="font-bold text-white">{t.author} {t.role && <span className="text-slate-400 font-normal">&bull; {t.role}</span>}</p>
                        <p className="text-slate-300 italic mt-0.5">&ldquo;{t.comment}&rdquo;</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestimonial(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-slate-300">Adicionar Novo Depoimento</p>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Nome do aluno/cliente"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Profissão / Cidade (Opcional)"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Comentário do cliente..."
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddTestimonial}
                      disabled={!newAuthor.trim() || !newComment.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar à Lista
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-6 p-6 bg-slate-950 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Pré-visualização em Tempo Real
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Modo Checkout</span>
              </div>

              {/* Mock Browser Window */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
                {/* Header preview */}
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: brandColor }}
                      >
                        ✓
                      </div>
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{brandName || 'Sua Marca'}</span>
                  </div>

                  {showCountdown && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <Clock className="w-3 h-3 animate-pulse" />
                      <span>{countdownMinutes}:00</span>
                    </div>
                  )}
                </div>

                {/* Body preview */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{itemTitle}</p>
                      <p className="text-[10px] text-slate-400">Infoproduto Digital</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })
                        .format(itemPrice)
                        .replace('AOA', 'Kz')}
                    </span>
                  </div>

                  {guaranteeBadge && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/20 text-[10px] flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">Garantia de {guaranteeDays} Dias:</span>
                        <p className="text-slate-400 mt-0.5">{guaranteeText || 'Satisfação 100% garantida ou seu dinheiro de volta.'}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <div className="h-7 bg-slate-950 rounded border border-slate-800 flex items-center px-2 text-[10px] text-slate-400">
                      Nome: Manuel António
                    </div>
                    <div className="h-7 bg-slate-950 rounded border border-slate-800 flex items-center px-2 text-[10px] text-slate-400">
                      E-mail: manuel@exemplo.ao
                    </div>
                    <div className="h-7 bg-slate-950 rounded border border-slate-800 flex items-center px-2 text-[10px] text-slate-400">
                      Telemóvel MCX: 923 456 789
                    </div>
                  </div>

                  {/* Custom Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-lg text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      {buttonText || 'Pagar Agora'} &rarr;
                    </button>
                  </div>

                  {showTestimonials && testimonials.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-300 italic">&ldquo;{testimonials[0].comment}&rdquo;</p>
                      <p className="text-[9px] font-bold text-white mt-0.5">- {testimonials[0].author}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? 'A guardar...' : 'Guardar Personalização'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
