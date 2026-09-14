import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BookOpen, 
  PlayCircle, 
  ArrowDownToLine, 
  FolderKanban, 
  Settings, 
  Box, 
  FileCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Building2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Smartphone, 
  ChevronRight, 
  Download, 
  Terminal,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { ClientApp, BankAccount, KycDocument, WithdrawalRequest, Charge } from '../types';

export type DevTabId = 
  | 'visao_geral'
  | 'transacoes'
  | 'guia_integracao'
  | 'testar_pagamento'
  | 'levantamentos'
  | 'meus_projetos'
  | 'definicoes'
  | 'recursos'
  | 'documentacao';

interface DeveloperPortalViewProps {
  onSwitchToAdmin?: () => void;
  initialTab?: DevTabId;
}

export const DeveloperPortalView: React.FC<DeveloperPortalViewProps> = ({
  initialTab = 'visao_geral',
  onSwitchToAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<DevTabId>(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLiveKey, setShowLiveKey] = useState(false);
  
  // Data state
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<ClientApp[]>([]);
  const [selectedProject, setSelectedProject] = useState<ClientApp | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [kycDocs, setKycDocs] = useState<KycDocument[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  
  // Modal states
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any | null>(null);
  
  // Form states
  const [bankForm, setBankForm] = useState({
    holderName: 'Mauricio Kaleya',
    bankName: 'Banco Angolano de Investimentos (BAI)',
    iban: '004000003224707910198',
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    webhookUrl: '',
  });
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycSuccessMsg, setKycSuccessMsg] = useState<string | null>(null);
  
  // Test Payment Simulator State
  const [testMethod, setTestMethod] = useState<'GPO' | 'GPR'>('GPO');
  const [testAmount, setTestAmount] = useState('5000');
  const [testPhone, setTestPhone] = useState('923456789');
  const [testCustomerName, setTestCustomerName] = useState('Cliente Teste');
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Integration Code Snippets
  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'node' | 'python' | 'php'>('node');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [summaryData, bankData, kycData, wthData] = await Promise.all([
        api.getDeveloperSummary().catch(() => null),
        api.getBankAccount().catch(() => null),
        api.getKycDocuments().catch(() => []),
        api.getWithdrawals().catch(() => []),
      ]);

      if (summaryData) {
        setSummary(summaryData);
        if (summaryData.projects && summaryData.projects.length > 0) {
          setProjects(summaryData.projects);
          setSelectedProject(summaryData.projects[0]);
        }
      }

      if (bankData) {
        setBankAccount(bankData);
        setBankForm({
          holderName: bankData.holderName || 'Mauricio Kaleya',
          bankName: bankData.bankName || 'Banco Angolano de Investimentos (BAI)',
          iban: bankData.iban || '004000003224707910198',
        });
      }

      if (kycData) setKycDocs(kycData);
      if (wthData) setWithdrawals(wthData);
    } catch (err) {
      console.error('Failed to load developer portal data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.saveBankAccount(bankForm);
      setBankAccount(updated);
      setShowEditBankModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao guardar conta bancária');
    }
  };

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) return;
    setKycUploading(true);
    try {
      await api.submitKyc({
        docType: 'identity',
        fileName: kycFile.name,
        fileSize: `${(kycFile.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      setKycSuccessMsg('Documento de identificação submetido com sucesso. Em análise de conformidade.');
      setKycFile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar documento');
    } finally {
      setKycUploading(false);
    }
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum < 1000) {
      alert('O valor mínimo de levantamento é 1.000,00 Kz');
      return;
    }
    try {
      await api.createWithdrawal(amountNum);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      alert('Pedido de levantamento registado com sucesso para a conta BAI.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Falha ao solicitar levantamento');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.name) return;
    try {
      const created = await api.createApp(newProjectForm);
      setShowNewProjectModal(false);
      setNewProjectForm({ name: '', description: '', webhookUrl: '' });
      await loadData();
      if (created) setSelectedProject(created);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar projeto');
    }
  };

  const handleRotateKey = async (appId: string) => {
    if (!confirm('Tem a certeza que deseja gerar uma nova chave de API? A chave antiga deixará de funcionar imediatamente.')) {
      return;
    }
    try {
      const updated = await api.rotateAppKeys(appId, 'all');
      setSelectedProject(updated);
      await loadData();
      alert('Novas chaves de API geradas com sucesso.');
    } catch (err: any) {
      alert(err.message || 'Erro ao regenerar chaves');
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const updated = await api.updateApp(selectedProject.id, { webhookUrl: webhookUrlInput });
      setSelectedProject(updated);
      setShowWebhookModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar webhook');
    }
  };

  const handleRunTestPayment = async () => {
    setTestSimulating(true);
    setTestResult(null);
    try {
      const apiKey = selectedProject?.apiKeyLive || 'nvx_live_5b2173ea901844bca';
      const res = await fetch('/api/v1/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          amount: parseFloat(testAmount),
          method: testMethod,
          phoneNumber: testMethod === 'GPO' ? testPhone : undefined,
          customerName: testCustomerName,
          description: `Teste interativo Pay Yetux via ${testMethod}`,
          merchantTransactionId: `tx_test_${Date.now()}`,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      await loadData();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestSimulating(false);
    }
  };

  const navTabs = [
    { id: 'visao_geral', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
    { id: 'guia_integracao', label: 'Guia de integração', icon: BookOpen },
    { id: 'testar_pagamento', label: 'Testar pagamento', icon: PlayCircle },
    { id: 'levantamentos', label: 'Levantamentos', icon: ArrowDownToLine },
    { id: 'meus_projetos', label: 'Meus projetos', icon: FolderKanban },
    { id: 'definicoes', label: 'Definições', icon: Settings },
    { id: 'recursos', label: 'Recursos', icon: Box },
    { id: 'documentacao', label: 'Documentação', icon: FileCode },
  ];

  const primaryProject = selectedProject || projects[0] || {
    id: 'prj_chave_inicial',
    name: 'Chave inicial',
    apiKeyLive: 'nvx_live_5b2173ea901844bca',
    apiKeyTest: 'py_test_7e31b942ac1104e2',
    isActive: true,
    webhookUrl: '',
    createdAt: '2026-09-14T03:29:00Z',
  };

  const totalSales = summary?.totalSalesVolume || 0;
  const availableBal = summary?.availableBalance || 0;
  const completedCount = summary?.approvedPaymentsCount || 0;
  const pendingCount = summary?.pendingPaymentsCount !== undefined ? summary.pendingPaymentsCount : 3;
  const totalCount = summary?.totalTransactionsCount || 6;
  const convRate = summary?.conversionRate !== undefined ? summary.conversionRate : 0.0;
  const recentTxs: any[] = summary?.recentTransactions || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Breadcrumb & Project Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-sm shadow-emerald-500/20">
              PY
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Área de Desenvolvedores
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">Pay Yetux API v1</span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                Projeto Ativo:
                <select 
                  value={primaryProject.id}
                  onChange={(e) => {
                    const found = projects.find((p) => p.id === e.target.value);
                    if (found) setSelectedProject(found);
                  }}
                  className="bg-slate-800 border border-slate-700 text-emerald-300 text-xs sm:text-sm font-mono rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Voltar ao Painel Geral de Administração"
              >
                Painel Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('testar_pagamento')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Testar Pagamento
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Projeto
            </button>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Subnavigation Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DevTabId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: VISÃO GERAL                                                 */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'visao_geral' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Volume Total */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Volume total</span>
                  <span className="text-[11px] text-slate-500">Últimos 30 dias</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                  {totalSales.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Movimentação financeira liquidada</span>
                </div>
              </div>

              {/* Saldo Disponível */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Saldo disponível</span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Líquido
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight font-mono">
                  {availableBal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Disponível para levantamento</span>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline transition-colors"
                  >
                    Levantar
                  </button>
                </div>
              </div>

              {/* Concluídos / Pendentes */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Concluídos</span>
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {pendingCount} pendentes
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                  {completedCount}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">{completedCount} concluídas</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-medium">{pendingCount} aguardando</span>
                </div>
              </div>

              {/* Conversão */}
              <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Conversão</span>
                  <span className="text-[11px] text-slate-500">{completedCount}/{totalCount} transações</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                  {convRate.toFixed(1)}%
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.max(5, Math.min(100, convRate))}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Volume · Hoje */}
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    Volume · Hoje
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      (00:00 às 23:00)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histórico de volume financeiro confirmado
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    0,00 Kz · 0 pagamentos
                  </div>
                  <span className="text-[11px] text-slate-500">Multicaixa Express & GPR</span>
                </div>
              </div>

              {/* Hourly 24-Bar Timeline Visualizer */}
              <div className="pt-2">
                <div className="h-28 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-slate-800 pb-2">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = `${i.toString().padStart(2, '0')}:00`;
                    const bucket = summary?.todayHourlyVolume?.find((b: any) => b.hour === hour);
                    const amount = bucket ? bucket.amount : 0;
                    const max = 50000;
                    const heightPercent = amount > 0 ? Math.min(100, Math.max(15, (amount / max) * 100)) : 6;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            amount > 0 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-slate-950 border border-slate-700 text-white text-[10px] rounded px-2 py-1 shadow-lg whitespace-nowrap font-mono">
                            {hour}: {amount.toLocaleString('pt-AO')} Kz
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 px-1">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>

            {/* Últimas Transações Preview */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Últimas transações</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Operações recebidas pela API Pay Yetux</p>
                </div>
                <button
                  onClick={() => setActiveTab('transacoes')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  Ver mais
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Transação / Método</th>
                      <th className="py-3 px-4">Bruto</th>
                      <th className="py-3 px-4">Taxa</th>
                      <th className="py-3 px-4">Líquido</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentTxs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          Nenhuma transação registada até ao momento.
                        </td>
                      </tr>
                    ) : (
                      recentTxs.slice(0, 6).map((tx) => (
                        <tr 
                          key={tx.id}
                          onClick={() => setSelectedTxDetail(tx)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                tx.method === 'GPO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {tx.method}
                              </span>
                              <div>
                                <div className="font-medium text-slate-200">{tx.description || tx.appName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{tx.merchantTransactionId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-white">
                            {tx.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            - {tx.feeAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                            {tx.netAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              tx.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {tx.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                              {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                              {tx.status === 'failed' && <XCircle className="w-3 h-3" />}
                              {tx.status === 'expired' && <AlertCircle className="w-3 h-3" />}
                              {tx.status === 'paid' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : tx.status === 'failed' ? 'Falhado' : 'Expirado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString('pt-AO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projetos em Destaque */}
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Projetos</h3>
                  <p className="text-xs text-slate-400">Cada projeto tem chave de API e webhook próprios.</p>
                </div>
                <button
                  onClick={() => setActiveTab('meus_projetos')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Gerir todos
                </button>
              </div>

              {/* Chave Inicial Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{primaryProject.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ativo
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                    <span>
                      {showLiveKey ? primaryProject.apiKeyLive : `${primaryProject.apiKeyLive.substring(0, 12)}...••••`}
                    </span>
                    <button
                      onClick={() => setShowLiveKey(!showLiveKey)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {showLiveKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(primaryProject.apiKeyLive, 'apiKeyLive')}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedKey === 'apiKeyLive' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                    <span>0,00 Kz</span>
                    <span>•</span>
                    <span>4 transações</span>
                    <span>•</span>
                    <span>14/09/26, 03:29</span>
                    <span>•</span>
                    <span className="text-slate-400">{primaryProject.webhookUrl ? 'Callback ativo' : 'Sem callback'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWebhookUrlInput(primaryProject.webhookUrl || '');
                      setShowWebhookModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-all"
                  >
                    Configurar Webhook
                  </button>
                  <button
                    onClick={() => handleRotateKey(primaryProject.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-all"
                  >
                    Regenerar Chave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: TRANSAÇÕES                                                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'transacoes' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Transações do Projeto</h2>
                <p className="text-xs text-slate-400">Histórico completo de cobranças e faturas processadas via Pay Yetux.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('testar_pagamento')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Testar Cobrança
                </button>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Identificador</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Bruto</th>
                      <th className="py-3 px-4">Taxa (1.5%)</th>
                      <th className="py-3 px-4">Líquido</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentTxs.map((tx) => (
                      <tr 
                        key={tx.id}
                        onClick={() => setSelectedTxDetail(tx)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-200">{tx.merchantTransactionId}</div>
                          <div className="text-[10px] text-slate-500">{tx.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            tx.method === 'GPO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {tx.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          {tx.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          - {tx.feeAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                          {tx.netAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            tx.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {tx.status === 'paid' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                          {new Date(tx.createdAt).toLocaleString('pt-AO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: GUIA DE INTEGRAÇÃO                                          */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'guia_integracao' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
              <h2 className="text-lg font-bold text-white">Guia de Integração Rápida</h2>
              <p className="text-xs text-slate-400 mt-1">
                Conecte a sua aplicação à Pay Yetux em menos de 5 minutos utilizando a nossa API REST padronizada.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">1</div>
                <h4 className="font-semibold text-sm text-white">Autenticação</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Envie o cabeçalho <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">Authorization: Bearer {primaryProject.apiKeyLive.substring(0, 14)}...</code> em todas as requisições à API.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">2</div>
                <h4 className="font-semibold text-sm text-white">Criar Cobrança</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Faça um POST para <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">/api/v1/charges</code> especificando o montante e o método (GPO ou GPR).
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">3</div>
                <h4 className="font-semibold text-sm text-white">Recepção de Webhooks</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure o seu endpoint de callback para receber notificações em tempo real quando o cliente pagar via Multicaixa.
                </p>
              </div>
            </div>

            {/* Code Examples */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Exemplo de Código:</span>
                  {(['curl', 'node', 'python', 'php'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveCodeLang(lang)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        activeCodeLang === lang
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'curl' ? 'cURL' : lang === 'node' ? 'Node.js' : lang === 'python' ? 'Python' : 'PHP'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const code = activeCodeLang === 'curl' ? `curl -X POST https://api.payyetux.co.ao/api/v1/charges \\\n  -H "Authorization: Bearer ${primaryProject.apiKeyLive}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount": 10000, "method": "GPO", "phoneNumber": "923456789", "merchantTransactionId": "ped_1001"}'` : '';
                    handleCopy(code, 'codeSnippet');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </button>
              </div>

              <pre className="p-4 text-xs font-mono bg-slate-950 text-slate-300 overflow-x-auto leading-relaxed">
{activeCodeLang === 'curl' && `curl -X POST https://api.payyetux.co.ao/api/v1/charges \\
  -H "Authorization: Bearer ${primaryProject.apiKeyLive}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "AOA",
    "method": "GPO",
    "phoneNumber": "923456789",
    "merchantTransactionId": "ped_10492",
    "description": "Pagamento de encomenda #10492"
  }'`}
{activeCodeLang === 'node' && `import fetch from 'node-fetch';

const response = await fetch('https://api.payyetux.co.ao/api/v1/charges', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${primaryProject.apiKeyLive}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 10000,
    currency: 'AOA',
    method: 'GPO', // ou 'GPR' para Referência Multicaixa
    phoneNumber: '923456789',
    merchantTransactionId: 'ped_10492',
    description: 'Pagamento de teste via Pay Yetux'
  })
});

const data = await response.json();
console.log('Cobrança Pay Yetux:', data);`}
{activeCodeLang === 'python' && `import requests

url = "https://api.payyetux.co.ao/api/v1/charges"
headers = {
    "Authorization": "Bearer ${primaryProject.apiKeyLive}",
    "Content-Type": "application/json"
}
payload = {
    "amount": 10000,
    "currency": "AOA",
    "method": "GPO",
    "phoneNumber": "923456789",
    "merchantTransactionId": "ped_10492",
    "description": "Pagamento via Pay Yetux"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
{activeCodeLang === 'php' && `<?php
$ch = curl_init('https://api.payyetux.co.ao/api/v1/charges');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${primaryProject.apiKeyLive}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'amount' => 10000,
    'currency' => 'AOA',
    'method' => 'GPO',
    'phoneNumber' => '923456789',
    'merchantTransactionId' => 'ped_10492',
    'description' => 'Pagamento Pay Yetux'
]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`}
              </pre>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: TESTAR PAGAMENTO                                            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'testar_pagamento' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
              <h2 className="text-lg font-bold text-white">Simulador de Pagamento Interativo</h2>
              <p className="text-xs text-slate-400 mt-1">
                Dispare cobranças reais ou simuladas para testar o envio de notificações Multicaixa Express (GPO) e geração de referências bancárias (GPR).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTestMethod('GPO')}
                      className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                        testMethod === 'GPO'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <div>
                        <div className="text-xs">Multicaixa Express</div>
                        <div className="text-[10px] text-slate-500">Notificação no Telemóvel (GPO)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTestMethod('GPR')}
                      className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                        testMethod === 'GPR'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <div>
                        <div className="text-xs">Referência Bancária</div>
                        <div className="text-[10px] text-slate-500">Entidade e Referência (GPR)</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Montante a Cobrar (Kz)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="Ex: 5000"
                  />
                </div>

                {testMethod === 'GPO' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Número de Telemóvel (Angola)</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      placeholder="923456789"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">O terminal MCX do utilizador receberá a solicitação de autorização.</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    value={testCustomerName}
                    onChange={(e) => setTestCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Nome do cliente"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunTestPayment}
                  disabled={testSimulating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  {testSimulating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando com o Gateway Nuvex...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Disparar Cobrança de Teste
                    </>
                  )}
                </button>
              </div>

              {/* Output Column */}
              <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-semibold text-slate-300 font-mono">Resposta em Tempo Real</span>
                  {testResult && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {testResult.success ? 'SUCESSO (200/201)' : 'ERRO NA REQUISIÇÃO'}
                    </span>
                  )}
                </div>

                {testResult ? (
                  <div className="space-y-4 flex-1">
                    {testResult.charge?.referenceDetails && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2">
                        <div className="text-xs text-emerald-400 font-medium">Referência Multicaixa Emitida</div>
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block text-[10px]">Entidade</span>
                            <span className="font-bold text-white text-sm">{testResult.charge.referenceDetails.entity}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block text-[10px]">Referência</span>
                            <span className="font-bold text-emerald-400 text-sm">{testResult.charge.referenceDetails.reference}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded">
                            <span className="text-slate-500 block text-[10px]">Valor</span>
                            <span className="font-bold text-white text-sm">{testResult.charge.referenceDetails.amount} Kz</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-72">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                    <Terminal className="w-8 h-8 text-slate-600" />
                    <p className="text-xs">Preencha o formulário e dispare uma cobrança para visualizar a resposta JSON e dados de pagamento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: LEVANTAMENTOS                                               */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'levantamentos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Levantamentos Bancários</h2>
                <p className="text-xs text-slate-400">Transfira o seu saldo disponível diretamente para a sua conta bancária angolana.</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/20"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Solicitar Levantamento
              </button>
            </div>

            {/* Balances Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Saldo Disponível</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {availableBal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </div>
                <span className="text-[11px] text-slate-500">Pronto para transferência</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Conta de Liquidação</span>
                <div className="text-sm font-semibold text-white mt-1">{bankAccount?.bankName || 'BAI'}</div>
                <span className="text-xs text-slate-400 font-mono">{bankAccount?.iban || '004000003224707910198'}</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Prazo Médio de Liquidação</span>
                <div className="text-sm font-semibold text-white mt-1">Instantâneo / Até 24h úteis</div>
                <span className="text-[11px] text-slate-500">Rede Interbancária EMIS</span>
              </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Histórico de Levantamentos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Referência</th>
                      <th className="py-3 px-4">Valor Bruto</th>
                      <th className="py-3 px-4">Taxa EMIS</th>
                      <th className="py-3 px-4">Valor Líquido</th>
                      <th className="py-3 px-4">Conta de Destino</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                          Nenhum pedido de levantamento realizado até ao momento.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono text-slate-200">{w.id}</td>
                          <td className="py-3 px-4 font-mono font-medium text-white">{w.amount.toLocaleString('pt-AO')} Kz</td>
                          <td className="py-3 px-4 font-mono text-slate-400">- {w.fee.toLocaleString('pt-AO')} Kz</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{w.netAmount.toLocaleString('pt-AO')} Kz</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{w.bankAccount.bankName}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              w.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : w.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {w.status === 'completed' ? 'Liquidado' : w.status === 'pending' ? 'Em Processamento' : 'Rejeitado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">{new Date(w.requestedAt).toLocaleDateString('pt-AO')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: MEUS PROJETOS                                               */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'meus_projetos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Meus Projetos & Chaves de API</h2>
                <p className="text-xs text-slate-400">Cada projeto tem chave de API e webhook próprios para as suas integrações.</p>
              </div>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Novo Projeto
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{proj.name}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                          {proj.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{proj.description || 'Aplicação integrada com Pay Yetux'}</p>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Criado em {new Date(proj.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Live Key */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Chave de Produção (Live Key)</span>
                        <span className="text-emerald-400 font-semibold text-[10px]">LIVE</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-200 truncate">
                          {showLiveKey ? proj.apiKeyLive : `${proj.apiKeyLive.substring(0, 16)}••••••••`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setShowLiveKey(!showLiveKey)}
                            className="text-slate-400 hover:text-slate-200 p-1"
                          >
                            {showLiveKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(proj.apiKeyLive, `key_${proj.id}`)}
                            className="text-emerald-400 hover:text-emerald-300 p-1"
                          >
                            {copiedKey === `key_${proj.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Test Key */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Chave de Sandbox / Teste</span>
                        <span className="text-amber-400 font-semibold text-[10px]">TEST</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-300 truncate">{proj.apiKeyTest}</span>
                        <button
                          onClick={() => handleCopy(proj.apiKeyTest, `test_${proj.id}`)}
                          className="text-emerald-400 hover:text-emerald-300 p-1 shrink-0"
                        >
                          {copiedKey === `test_${proj.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Webhook & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">URL de Webhook:</span>
                      <span className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {proj.webhookUrl || 'Sem callback configurado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProject(proj);
                          setWebhookUrlInput(proj.webhookUrl || '');
                          setShowWebhookModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                      >
                        Configurar Webhook
                      </button>
                      <button
                        onClick={() => handleRotateKey(proj.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                      >
                        Regenerar Chaves
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 7: DEFINIÇÕES                                                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'definicoes' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
              <h2 className="text-lg font-bold text-white">Definições da Conta</h2>
              <p className="text-xs text-slate-400">Configure a sua conta bancária de recebimento e realize a verificação de identidade KYC.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Conta Bancária */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-sm text-white">Conta bancária</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Guardada
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase">Titular</span>
                    <span className="font-semibold text-white">{bankAccount?.holderName || 'Mauricio Kaleya'}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase">Banco</span>
                    <span className="text-slate-200">{bankAccount?.bankName || 'Banco Angolano de Investimentos (BAI)'}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase">IBAN</span>
                    <span className="font-mono text-emerald-400 font-semibold">{bankAccount?.iban || '004000003224707910198'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditBankModal(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
                >
                  Editar conta
                </button>
              </div>

              {/* Card 2: Verificação KYC */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-semibold text-sm text-white">Verificação KYC</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    summary?.kycStatus === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {summary?.kycStatus === 'verified' ? 'Verificado' : 'Pendente'}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {summary?.kycStatus === 'verified' 
                        ? 'A sua identidade foi validada com sucesso pela equipa Pay Yetux. Todas as funcionalidades de recebimento e levantamento estão ativas.'
                        : 'A sua identidade ainda não foi validada. Envie um documento de identificação (BI ou passaporte) para ativar funcionalidades adicionais da conta.'}
                    </p>
                  </div>

                  <form onSubmit={handleKycUpload} className="space-y-3 pt-2">
                    <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-4 text-center cursor-pointer transition-colors">
                      <input
                        type="file"
                        id="kyc-file-input"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setKycFile(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                      <label htmlFor="kyc-file-input" className="cursor-pointer space-y-1 block">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs text-emerald-400 font-medium">
                          {kycFile ? kycFile.name : 'Enviar documento'}
                        </div>
                        <div className="text-[10px] text-slate-500">PDF, imagem. Máx. 10MB</div>
                      </label>
                    </div>

                    {kycSuccessMsg && (
                      <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                        {kycSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!kycFile || kycUploading}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-emerald-500/20"
                    >
                      {kycUploading ? 'Enviando documento...' : 'Submeter para Validação'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 8: RECURSOS                                                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'recursos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
              <h2 className="text-lg font-bold text-white">Recursos & Ferramentas para Desenvolvedores</h2>
              <p className="text-xs text-slate-400">Bibliotecas, utilitários de assinatura e kits de integração oficial.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <Download className="w-6 h-6 text-emerald-400" />
                <h4 className="font-semibold text-sm text-white">Coleção Postman</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Importe todas as rotas e testes pré-configurados para a sua ferramenta de API.
                </p>
                <button 
                  onClick={() => alert('Download do Postman Collection Pay Yetux v1')}
                  className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  Descarregar JSON (.postman_collection)
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
                <h4 className="font-semibold text-sm text-white">Verificação de Assinaturas</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aprenda a validar cabeçalhos HMAC SHA-256 dos Webhooks para garantir segurança contra spoofing.
                </p>
                <button 
                  onClick={() => setActiveTab('documentacao')}
                  className="text-xs text-teal-400 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver Guia de Segurança
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <Box className="w-6 h-6 text-blue-400" />
                <h4 className="font-semibold text-sm text-white">SDKs Oficiais</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pacotes prontos para Node.js (<code className="text-emerald-300">npm install @payyetux/sdk</code>), Python e PHP.
                </p>
                <button 
                  onClick={() => setActiveTab('guia_integracao')}
                  className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1"
                >
                  Consultar Exemplos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 9: DOCUMENTAÇÃO                                                */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'documentacao' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800">
              <h2 className="text-lg font-bold text-white">Documentação da API REST Pay Yetux</h2>
              <p className="text-xs text-slate-400">Referência completa de endpoints, cabeçalhos, parâmetros e respostas.</p>
            </div>

            <div className="space-y-4">
              {/* Endpoint 1: Criar Cobrança */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    POST
                  </span>
                  <code className="text-sm font-mono text-white">/api/v1/charges</code>
                </div>
                <p className="text-xs text-slate-300">Cria uma nova cobrança Multicaixa Express (GPO) ou Referência Bancária (GPR).</p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-slate-400 font-semibold">Parâmetros do Pedido (Body JSON):</div>
                  <div className="text-slate-300 pl-2 space-y-1">
                    <div><span className="text-emerald-400">amount</span> (number, obrigatório): Valor em Kwanzas (ex: 5000)</div>
                    <div><span className="text-emerald-400">currency</span> (string): "AOA" (padrão)</div>
                    <div><span className="text-emerald-400">method</span> (string, obrigatório): "GPO" (Multicaixa Express) ou "GPR" (Referência)</div>
                    <div><span className="text-emerald-400">phoneNumber</span> (string): Obrigatório para GPO (ex: "923456789")</div>
                    <div><span className="text-emerald-400">merchantTransactionId</span> (string): O seu identificador de pedido único</div>
                    <div><span className="text-emerald-400">description</span> (string): Descrição exibida ao cliente</div>
                  </div>
                </div>
              </div>

              {/* Endpoint 2: Consultar Estado */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    GET
                  </span>
                  <code className="text-sm font-mono text-white">/api/v1/charges/:id</code>
                </div>
                <p className="text-xs text-slate-300">Consulta o estado atualizado de uma cobrança por ID Pay Yetux ou merchantTransactionId.</p>
              </div>

              {/* Webhook Events */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm text-white">Eventos de Webhook</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">charge.paid</span>
                    <span className="text-slate-400 text-[11px]">Pagamento confirmado e saldo creditado.</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-rose-400 font-bold block mb-1">charge.failed</span>
                    <span className="text-slate-400 text-[11px]">Cancelado, tempo expirado ou rejeitado na EMIS.</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">charge.pending</span>
                    <span className="text-slate-400 text-[11px]">Aguardando confirmação do terminal.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDITAR CONTA BANCÁRIA                                       */}
      {/* ------------------------------------------------------------------ */}
      {showEditBankModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Editar Conta Bancária</h3>
              <button 
                onClick={() => setShowEditBankModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Titular da Conta</label>
                <input
                  type="text"
                  value={bankForm.holderName}
                  onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nome do Banco</label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">IBAN (Angola)</label>
                <input
                  type="text"
                  value={bankForm.iban}
                  onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="004000003224707910198"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Guardar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: SOLICITAR LEVANTAMENTO                                      */}
      {/* ------------------------------------------------------------------ */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Solicitar Levantamento</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Saldo Disponível:</span>
                <span className="font-mono font-bold text-emerald-400">{availableBal.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Conta de Destino:</span>
                <span className="text-slate-200">{bankAccount?.bankName || 'BAI'} ({bankAccount?.iban?.substring(0, 10)}...)</span>
              </div>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Montante a Transferir (Kz)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-base focus:border-emerald-500 focus:outline-none"
                  placeholder="Min: 1.000,00 Kz"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Confirmar Levantamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CRIAR NOVO PROJETO                                          */}
      {/* ------------------------------------------------------------------ */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Criar Novo Projeto</h3>
              <button 
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex: Minha Loja Virtual, App Mobile"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Integração de checkout e-commerce"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">URL de Webhook (Opcional)</label>
                <input
                  type="url"
                  value={newProjectForm.webhookUrl}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, webhookUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="https://seu-app.com/api/webhooks/payyetux"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CONFIGURAR WEBHOOK                                          */}
      {/* ------------------------------------------------------------------ */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Configurar Webhook</h3>
              <button 
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">URL de Callback (HTTPS)</label>
                <input
                  type="url"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="https://seu-site.com/api/payyetux/webhook"
                />
                <p className="text-[10px] text-slate-500 mt-1">Receberá requisições POST sempre que uma fatura for paga ou expirar.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                >
                  Salvar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: DETALHES DA TRANSAÇÃO                                       */}
      {/* ------------------------------------------------------------------ */}
      {selectedTxDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Detalhes da Transação</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedTxDetail.id}</span>
              </div>
              <button 
                onClick={() => setSelectedTxDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Identificador Merchant:</span>
                  <span className="text-white">{selectedTxDetail.merchantTransactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Método:</span>
                  <span className="text-emerald-400 font-bold">{selectedTxDetail.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Bruto:</span>
                  <span className="text-white">{selectedTxDetail.grossAmount?.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa do Serviço (1.5%):</span>
                  <span className="text-slate-400">- {selectedTxDetail.feeAmount?.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-400">Valor Líquido:</span>
                  <span className="text-emerald-400 font-bold">{selectedTxDetail.netAmount?.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado:</span>
                  <span className="text-white uppercase">{selectedTxDetail.status}</span>
                </div>
              </div>

              {selectedTxDetail.referenceDetails && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg space-y-1">
                  <div className="text-emerald-400 font-bold text-[11px]">Dados Multicaixa (GPR):</div>
                  <div className="text-slate-300">Entidade: {selectedTxDetail.referenceDetails.entity}</div>
                  <div className="text-slate-300">Referência: {selectedTxDetail.referenceDetails.reference}</div>
                  <div className="text-slate-300">Montante: {selectedTxDetail.referenceDetails.amount} Kz</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
