import React from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  ArrowUpRight, 
  ChevronRight,
  ShieldCheck,
  Zap,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { GatewayStats, Charge, ProviderConfig } from '../types';

interface DashboardViewProps {
  stats: GatewayStats | null;
  recentCharges: Charge[];
  providerConfig: ProviderConfig | undefined;
  onNavigate: (tab: string) => void;
  onInspectCharge: (charge: Charge) => void;
  onOpenNewCharge: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentCharges,
  providerConfig,
  onNavigate,
  onInspectCharge,
  onOpenNewCharge,
}) => {
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  const methodDistributionData = [
    { name: 'Multicaixa Express (GPO)', value: stats?.volumeByMethod.gpo || 0, color: '#2563eb' },
    { name: 'Referência Bancária (GPR)', value: stats?.volumeByMethod.gpr || 0, color: '#0f172a' },
  ];

  const totalMethodVolume = (stats?.volumeByMethod.gpo || 0) + (stats?.volumeByMethod.gpr || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Info */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border border-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Provedor Nuvex Ativo & Operacional
            </span>
            <span className="text-xs text-slate-400">
              Endpoints: GPO (Push MCX) e GPR (Referência ATM/IB)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Plataforma de Pagamentos Multi-Provedor
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Camada unificada para processamento de pagamentos em Angola, links de pagamento instantâneos, webhooks com validação HMAC e integração com sistemas externos.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            id="btn-dash-cobranca"
            onClick={onOpenNewCharge}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Criar Pagamento</span>
          </button>
          <button
            id="btn-dash-links"
            onClick={() => onNavigate('links')}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            <span>Links Rápidos</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Volume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Vendas</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatKz(stats?.totalSalesVolume || 0)}
            </div>
            <div className="flex items-center mt-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Volume acumulado em Kz</span>
            </div>
          </div>
        </div>

        {/* Approved Payments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aprovados (Paid)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.approvedPaymentsCount || 0}
            </div>
            <div className="flex items-center mt-1.5 text-xs text-slate-500 font-medium">
              Taxa de sucesso: <strong className="text-emerald-700 ml-1">{stats?.conversionRate || 0}%</strong>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendentes (Pending)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.pendingPaymentsCount || 0}
            </div>
            <div className="flex items-center mt-1.5 text-xs text-amber-700 font-medium">
              Aguardando confirmação MCX/ATM
            </div>
          </div>
        </div>

        {/* Failed / Cancelled */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Falhados / Cancelados</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.failedPaymentsCount || 0}
            </div>
            <div className="flex items-center mt-1.5 text-xs text-slate-500 font-medium">
              Total de transações: {stats?.totalTransactionsCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolução Diária de Vendas</h3>
              <p className="text-xs text-slate-500">Volume confirmado em Kwanzas nos últimos 7 dias</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
              Últimos 7 dias
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyVolume || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatKz(Number(val)), 'Volume']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Métodos de Pagamento</h3>
            <p className="text-xs text-slate-500">Volume por método disponibilizado</p>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {methodDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatKz(Number(val)), 'Total']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="font-medium text-slate-700">Multicaixa Express (GPO)</span>
              </div>
              <span className="font-bold text-slate-900">{formatKz(stats?.volumeByMethod.gpo || 0)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                <span className="font-medium text-slate-700">Referência Bancária (GPR)</span>
              </div>
              <span className="font-bold text-slate-900">{formatKz(stats?.volumeByMethod.gpr || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transacções Recentes</h3>
            <p className="text-xs text-slate-500">Últimos pagamentos processados pelo gateway</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Ver todas as transacções</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">ID / Referência</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Montante</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCharges.slice(0, 5).map((charge) => {
                const isGPO = charge.method === 'GPO';
                return (
                  <tr key={charge.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">{charge.merchantTransactionId}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[140px]">{charge.description || 'Cobrança'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-900">{charge.customerName || 'Cliente Direto'}</div>
                      <div className="text-xs text-slate-400">{charge.customerEmail || charge.phoneNumber || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isGPO 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {isGPO ? (
                          <>
                            <Smartphone className="w-3 h-3 mr-1" />
                            MCX Express
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 mr-1" />
                            Referência
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatKz(charge.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        charge.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : charge.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {charge.status === 'paid' && 'Pago'}
                        {charge.status === 'pending' && 'Pendente'}
                        {charge.status === 'failed' && 'Falhado'}
                        {charge.status === 'cancelled' && 'Cancelado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(charge.createdAt).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onInspectCharge(charge)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
