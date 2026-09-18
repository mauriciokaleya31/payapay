import React, { useState } from 'react';
import { 
  Plus, 
  Store, 
  ShoppingBag, 
  Link2, 
  DollarSign, 
  Package, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink,
  Eye,
  X,
  Tag
} from 'lucide-react';
import { Product, PaymentLink } from '../types';

interface StoreViewProps {
  products: Product[];
  onCreateProduct: (payload: Partial<Product> & { createLink?: boolean }) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onOpenProductCheckout: (product: Product) => void;
  onNavigateToLinks: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  onCreateProduct,
  onDeleteProduct,
  onOpenProductCheckout,
  onNavigateToLinks,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Geral');
  const [stock, setStock] = useState('50');
  const [imageUrl, setImageUrl] = useState('');
  const [autoCreateLink, setAutoCreateLink] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsSubmitting(true);
    try {
      await onCreateProduct({
        name,
        description,
        price: Number(price),
        category,
        stock: stock ? Number(stock) : undefined,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
        createLink: autoCreateLink,
      });
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Geral');
    setStock('50');
    setImageUrl('');
  };

  const totalProducts = products.length;
  const totalSalesCount = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + p.price * (p.salesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Store className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Área de Vendas & Catálogo</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mini Loja / Produtos Digitais e Físicos</h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Registe produtos com preços em Kwanza, faça a gestão de stock e gere links de pagamento direto para vender instantaneamente.
          </p>
        </div>

        <button
          id="btn-novo-produto"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total de Produtos</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Vendas Realizadas</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{totalSalesCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Receita Gerada por Produtos</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatKz(totalPotentialRevenue)}</div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Product Image */}
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                  {prod.category}
                </span>
                <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {formatKz(prod.price)}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-2">
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {prod.description || 'Produto pronto para venda no gateway.'}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Stock disponível: <strong className="text-slate-800">{prod.stock ?? 'Ilimitado'}</strong></span>
                  <span>Vendas: <strong className="text-emerald-700">{prod.salesCount}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onOpenProductCheckout(prod)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Checkout</span>
              </button>

              <div className="flex items-center space-x-1">
                {prod.paymentLinkId ? (
                  <button
                    onClick={onNavigateToLinks}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Ver link configurado"
                  >
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Link Ativo</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await onCreateProduct({ ...prod, createLink: true });
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gerar Link</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteProduct(prod.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remover produto"
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
                <h3 className="text-lg font-bold text-slate-900">Novo Produto</h3>
                <p className="text-xs text-slate-500">Adicione ao seu catálogo de vendas</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Livro Digital, Acesso Plataforma, Teclado Mecânico"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Preço (AOA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Cursos, Hardware, Software"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes, especificações e condições..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">URL da Foto</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white text-slate-950 font-medium placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoCreateLink"
                  checked={autoCreateLink}
                  onChange={(e) => setAutoCreateLink(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="autoCreateLink" className="text-xs font-medium text-blue-900 cursor-pointer">
                  Gerar automaticamente Link de Pagamento com checkout público para este produto
                </label>
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
                  {isSubmitting ? 'Salvando...' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
