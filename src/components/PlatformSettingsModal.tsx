import React, { useState, useEffect } from 'react';
import { X, Globe, Image, Check, AlertCircle, Save, Sparkles, Building2, Mail, Phone } from 'lucide-react';
import { api } from '../services/api';
import { PlatformSettings } from '../types';

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: PlatformSettings) => void;
}

export const PlatformSettingsModal: React.FC<PlatformSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [platformName, setPlatformName] = useState('Pay Yetux');
  const [platformLogoUrl, setPlatformLogoUrl] = useState('');
  const [tagline, setTagline] = useState('Portal de Pagamentos Angola');
  const [supportEmail, setSupportEmail] = useState('suporte@payyetux.ao');
  const [supportPhone, setSupportPhone] = useState('+244 923 456 789');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    api.getPlatformSettings()
      .then((settings) => {
        if (settings) {
          setPlatformName(settings.platformName || 'Pay Yetux');
          setPlatformLogoUrl(settings.platformLogoUrl || '');
          setTagline(settings.tagline || 'Portal de Pagamentos Angola');
          setSupportEmail(settings.supportEmail || 'suporte@payyetux.ao');
          setSupportPhone(settings.supportPhone || '+244 923 456 789');
        }
      })
      .catch((err) => {
        console.warn('Could not load settings:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformName.trim()) {
      setErrorMsg('O nome da plataforma é obrigatório.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await api.updatePlatformSettings({
        platformName: platformName.trim(),
        platformLogoUrl: platformLogoUrl.trim(),
        tagline: tagline.trim(),
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
      });

      setSuccessMsg('Configurações da plataforma guardadas com sucesso!');
      if (onSaved) onSaved(updated);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Identidade da Plataforma
              </h3>
              <p className="text-xs text-slate-400">
                Altere o nome oficial e o logotipo de toda a aplicação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {platformLogoUrl.trim() ? (
                <img
                  src={platformLogoUrl.trim()}
                  alt="Pré-visualização do Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-400">Pré-visualização do Topo:</div>
              <div className="text-sm font-bold text-white truncate">
                {platformName.trim() || 'Pay Yetux'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {tagline.trim() || 'Portal de Pagamentos Angola'}
              </div>
            </div>
          </div>

          {/* Nome da Plataforma */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome da Plataforma *
            </label>
            <input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Ex: Pay Yetux, Angola Pay, etc."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* URL do Logotipo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>URL do Logotipo (Imagem)</span>
              <span className="text-[10px] text-slate-400 lowercase">https://...</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={platformLogoUrl}
                onChange={(e) => setPlatformLogoUrl(e.target.value)}
                placeholder="https://exemplo.ao/logo.png"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Deixe em branco para utilizar o ícone padrão do sistema.
            </span>
          </div>

          {/* Slogan / Subtítulo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Slogan / Subtítulo
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ex: Portal de Pagamentos Angola"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Suporte Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail de Suporte
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="suporte@plataforma.ao"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Telefone de Suporte
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
