import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Globe, 
  Send, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { ClientApp } from '../types';

interface DeveloperApiViewProps {
  apps: ClientApp[];
  onCreateApp: (payload: Partial<ClientApp>) => Promise<void>;
  onUpdateApp: (id: string, payload: Partial<ClientApp>) => Promise<void>;
  onDeleteApp: (id: string) => Promise<void>;
  onTestWebhook: (url: string, secret: string, event: string) => Promise<any>;
  onOpenFullPortal?: () => void;
}

export const DeveloperApiView: React.FC<DeveloperApiViewProps> = ({
  apps,
  onCreateApp,
  onUpdateApp,
  onDeleteApp,
  onTestWebhook,
  onOpenFullPortal,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python' | 'webhook'>('curl');

  // App Creation Form
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appWebhookUrl, setAppWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Webhook Tester State
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [testWebhookSecret, setTestWebhookSecret] = useState('');
  const [testEvent, setTestEvent] = useState('charge.paid');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const selectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName) return;

    setIsSubmitting(true);
    try {
      await onCreateApp({
        name: appName,
        description: appDesc,
        userEmail: appEmail || 'desenvolvedor@empresa.ao',
        webhookUrl: appWebhookUrl,
      });
      setIsModalOpen(false);
      setAppName('');
      setAppDesc('');
      setAppEmail('');
      setAppWebhookUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunWebhookTest = async () => {
    const targetUrl = testWebhookUrl || selectedApp?.webhookUrl;
    if (!targetUrl) {
      alert('Por favor informe um URL de Webhook para testar');
      return;
    }

    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await onTestWebhook(
        targetUrl,
        testWebhookSecret || selectedApp?.webhookSecret || 'whsec_test',
        testEvent
      );
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, statusCode: 0, responseBody: err.message });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Code snippets
  const curlCode = `curl -X POST "${window.location.origin}/api/v1/charges" \\
  -H "Authorization: Bearer ${selectedApp?.apiKeyLive || 'nvx_live_xxx'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "method": "GPO",
    "phone_number": "923456789",
    "merchant_transaction_id": "ped-2026-001",
    "description": "Pagamento no Meu Website"
  }'`;

  const jsCode = `// Node.js ou Frontend moderno
const response = await fetch("${window.location.origin}/api/v1/charges", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${selectedApp?.apiKeyLive || 'nvx_live_xxx'}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 25000,
    method: "GPO", // ou "GPR" para Referência Bancária
    phone_number: "923456789",
    merchant_transaction_id: "ped-2026-001",
    description: "Pagamento de Serviço"
  })
});

const data = await response.json();
console.log("Cobrança criada:", data.charge);`;

  const pythonCode = `import requests

url = "${window.location.origin}/api/v1/charges"
headers = {
    "Authorization": "Bearer ${selectedApp?.apiKeyLive || 'nvx_live_xxx'}",
    "Content-Type": "application/json"
}
payload = {
    "amount": 25000,
    "method": "GPO",
    "phone_number": "923456789",
    "merchant_transaction_id": "ped-2026-001",
    "description": "Pagamento via Gateway Nuvex"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const webhookVerifyCode = `// Validação do Webhook na sua aplicação cliente (Node.js Express)
import crypto from 'crypto';

app.post('/api/webhooks/gateway', express.raw({ type: 'application/json' }), (req, res) => {
  const signatureHeader = req.headers['x-gateway-signature']; // t=...,v1=...
  const secret = "${selectedApp?.webhookSecret || 'whsec_your_secret'}";

  const [tPart, v1Part] = signatureHeader.split(',');
  const t = tPart.split('=')[1];
  const signature = v1Part.split('=')[1];

  const expected = crypto.createHmac('sha256', secret)
    .update(\`\${t}.\${req.body.toString('utf8')}\`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isValid) return res.status(401).send('Assinatura inválida');

  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'charge.paid') {
    console.log('Pagamento recebido:', event.data.amount, 'Kz');
    // Marcar pedido como aprovado no seu banco de dados
  }

  res.status(200).json({ received: true });
});`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Code2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Área do Desenvolvedor & Integração</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chaves de API & Webhooks para Clientes</h2>
          <p className="text-xs text-slate-500">
            Gere credenciais para websites e sistemas externos receberem pagamentos automáticos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenFullPortal && (
            <button
              onClick={onOpenFullPortal}
              className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>Abrir Portal Dev & Empreendedor</span>
            </button>
          )}
          <button
            id="btn-criar-app"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Aplicação</span>
          </button>
        </div>
      </div>

      {/* App Selector Tabs */}
      {apps.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedAppId(app.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedApp?.id === app.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {app.name}
            </button>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: API Keys & Webhook Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live & Test Keys Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedApp.name}</h3>
                  <p className="text-xs text-slate-500">{selectedApp.description || 'Aplicação integrada'}</p>
                </div>
                <button
                  onClick={() => onDeleteApp(selectedApp.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Eliminar aplicação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Live Keys */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Ambiente de Produção (Live)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Public API Key (Live)</div>
                      <div className="font-mono text-xs text-slate-900 font-semibold">{selectedApp.apiKeyLive}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedApp.apiKeyLive, 'live_pub')}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      title="Copiar chave"
                    >
                      {copiedKey === 'live_pub' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Secret Key (Live)</div>
                      <div className="font-mono text-xs text-slate-900 font-semibold">
                        {showSecret['live_sec'] ? selectedApp.secretKeyLive : '••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleSecret('live_sec')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      >
                        {showSecret['live_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(selectedApp.secretKeyLive, 'live_sec')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      >
                        {copiedKey === 'live_sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test / Sandbox Keys */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Ambiente de Teste (Sandbox)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Test API Key</div>
                      <div className="font-mono text-xs text-slate-900 font-semibold">{selectedApp.apiKeyTest}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedApp.apiKeyTest, 'test_pub')}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      {copiedKey === 'test_pub' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Test Secret Key</div>
                      <div className="font-mono text-xs text-slate-900 font-semibold">
                        {showSecret['test_sec'] ? selectedApp.secretKeyTest : '••••••••••••••••••••••••••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleSecret('test_sec')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      >
                        {showSecret['test_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(selectedApp.secretKeyTest, 'test_sec')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      >
                        {copiedKey === 'test_sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration for this app */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Configuração de Webhooks
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Notificações em tempo real</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">URL de Callback (HTTPS)</label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        placeholder="https://seu-sistema.co.ao/api/webhooks"
                        value={selectedApp.webhookUrl || ''}
                        onChange={(e) => onUpdateApp(selectedApp.id, { webhookUrl: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Webhook Secret (HMAC-SHA256)</div>
                      <div className="font-mono text-xs text-slate-900 font-semibold">{selectedApp.webhookSecret}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedApp.webhookSecret || '', 'wh_sec')}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      {copiedKey === 'wh_sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Code Documentation Tabs */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Exemplos de Chamada de Cobrança</h4>
                </div>

                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setCodeLang('curl')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      codeLang === 'curl' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setCodeLang('js')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      codeLang === 'js' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setCodeLang('python')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      codeLang === 'python' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setCodeLang('webhook')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      codeLang === 'webhook' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Verificar HMAC
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="text-xs font-mono bg-slate-900 p-4 rounded-xl text-slate-300 overflow-x-auto leading-relaxed max-h-72">
                  {codeLang === 'curl' && curlCode}
                  {codeLang === 'js' && jsCode}
                  {codeLang === 'python' && pythonCode}
                  {codeLang === 'webhook' && webhookVerifyCode}
                </pre>
                <button
                  onClick={() => {
                    const text =
                      codeLang === 'curl'
                        ? curlCode
                        : codeLang === 'js'
                        ? jsCode
                        : codeLang === 'python'
                        ? pythonCode
                        : webhookVerifyCode;
                    handleCopy(text, 'snippet');
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Documentação oficial Nuvex:</span>
                <a
                  href="https://pagamentos-nuvex.lovable.app/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold"
                >
                  <span>pagamentos-nuvex.lovable.app/docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Live Webhook Dispatcher & Tester */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Zap className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Testador de Webhooks</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Envie um evento de teste em tempo real para validar o seu endpoint e a assinatura HMAC-SHA256.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Evento</label>
                  <select
                    value={testEvent}
                    onChange={(e) => setTestEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="charge.paid">charge.paid (Pagamento Aprovado)</option>
                    <option value="charge.pending">charge.pending (Aguardando Aprovação)</option>
                    <option value="charge.failed">charge.failed (Falha no Pagamento)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">URL de Destino</label>
                  <input
                    type="url"
                    placeholder={selectedApp.webhookUrl || 'https://webhook.site/...'}
                    value={testWebhookUrl}
                    onChange={(e) => setTestWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dica: Pode usar webhook.site para inspecionar headers recebidos
                  </span>
                </div>

                <button
                  onClick={handleRunWebhookTest}
                  disabled={isTestingWebhook}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTestingWebhook ? 'Enviando...' : 'Disparar Webhook de Teste'}</span>
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Resultado do Envio:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        testResult.success
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {testResult.statusCode || 0} ({testResult.latencyMs}ms)
                    </span>
                  </div>

                  {testResult.signatureHeader && (
                    <div className="text-[10px] text-slate-500 font-mono break-all">
                      <strong>Header:</strong> x-gateway-signature: {testResult.signatureHeader}
                    </div>
                  )}

                  {testResult.responseBody && (
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Resposta do Servidor:</span>
                      <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto max-h-24">
                        {testResult.responseBody}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick 4-Step Guide as requested by prompt */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-xs space-y-3">
              <h4 className="font-bold text-blue-950 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Início Rápido em 4 Passos</span>
              </h4>
              <ol className="space-y-2 text-blue-900 list-decimal list-inside leading-relaxed">
                <li>
                  <strong>Chave de API:</strong> Use a sua chave <code>nvx_live_...</code> no header <code>Authorization: Bearer</code>.
                </li>
                <li>
                  <strong>Webhook Secret:</strong> Valide as notificações usando o seu <code>whsec_...</code>.
                </li>
                <li>
                  <strong>Callback:</strong> Cadastre o seu URL HTTPS que recebe o evento <code>charge.paid</code>.
                </li>
                <li>
                  <strong>Idempotência:</strong> Garanta que o seu webhook handler responde 200 e é idempotente.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registar Nova Aplicação</h3>
                <p className="text-xs text-slate-500">Gera credenciais Live e Sandbox para o seu sistema</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Aplicação / Loja *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Minha Loja Virtual, App Mobile, ERP"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  placeholder="tech@minhaempresa.ao"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Webhook (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://meusite.ao/api/webhooks"
                  value={appWebhookUrl}
                  onChange={(e) => setAppWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Finalidade da integração..."
                  value={appDesc}
                  onChange={(e) => setAppDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
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
                  {isSubmitting ? 'Criando...' : 'Gerar Chaves'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
