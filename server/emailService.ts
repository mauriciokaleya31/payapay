import nodemailer from 'nodemailer';
import { store } from './store.js';
import { Charge, PlatformSettings } from './types.js';

let cachedTransporter: any = null;
let lastSettingsCheck: number = 0;

export function getEmailTransporter(): any {
  const now = Date.now();
  // Refresh transporter every 60 seconds or on demand
  if (cachedTransporter && now - lastSettingsCheck < 60000) {
    return cachedTransporter;
  }
  lastSettingsCheck = now;

  const settings: PlatformSettings = store.getPlatformSettings();

  const host = settings.smtpHost || process.env.SMTP_HOST;
  const port = Number(settings.smtpPort || process.env.SMTP_PORT) || 587;
  const user = settings.smtpUser || process.env.SMTP_USER;
  const pass = settings.smtpPass || process.env.SMTP_PASS;
  const secure = settings.smtpSecure !== undefined ? settings.smtpSecure : (process.env.SMTP_SECURE === 'true' || port === 465);

  if (host && user) {
    try {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: pass || '',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      return cachedTransporter;
    } catch (err: any) {
      console.warn('[Email] Erro ao criar transportador SMTP:', err.message);
    }
  }

  // Resilient fallback transporter for dev/preview: jsonTransport so emails never fail and are fully logged
  cachedTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return cachedTransporter;
}

export function resetTransporter(): void {
  cachedTransporter = null;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category: 'account_created' | 'payment_reference' | 'payment_paid' | 'test_email';
}

export async function sendSystemEmail({
  to,
  subject,
  html,
  text,
  category,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanTo = (to || '').trim().toLowerCase();
    if (!cleanTo || !cleanTo.includes('@')) {
      return { success: false, error: 'Endereço de e-mail inválido' };
    }

    const settings = store.getPlatformSettings();
    const platformName = settings.platformName || 'Pay Yetux Angola';
    const fromAddress = settings.smtpFrom || process.env.SMTP_FROM || `noreply@${platformName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ao`;
    const from = `"${platformName}" <${fromAddress}>`;

    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from,
      to: cleanTo,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });

    const isJsonTransport = (transporter as any).transporter?.name === 'JSONTransport' || (info as any).message;

    // Log to store audit logs so user & admin can inspect exact dispatch status
    store.addLog({
      type: 'webhook_dispatched',
      title: `E-mail Enviado: ${subject}`,
      details: `Destinatário: ${cleanTo} | Categoria: ${category} | MessageId: ${info.messageId || 'json-msg'} | Modo: ${isJsonTransport ? 'Simulação / Fallback' : 'SMTP Real'}`,
      endpoint: '/api/v1/system/email-dispatch',
      statusCode: 200,
      success: true,
    });

    console.log(`[Email] Envio para ${cleanTo} com assunto "${subject}". MessageId: ${info.messageId || 'ok'}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error('[Email] Falha ao enviar e-mail:', err);
    store.addLog({
      type: 'system_error',
      title: `Falha no Envio de E-mail para: ${to}`,
      details: err.message,
      endpoint: '/api/v1/system/email-dispatch',
      statusCode: 500,
      success: false,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send credentials for auto-created customer account
 */
export async function sendCustomerAccountCreatedEmail(
  to: string,
  name: string,
  temporaryPassword: string,
  loginUrl?: string
) {
  const settings = store.getPlatformSettings();
  const platformName = settings.platformName || 'Pay Yetux Angola';
  const logoUrl = settings.platformLogoUrl;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { max-height: 48px; border-radius: 8px; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; border: 1px solid rgba(16, 185, 129, 0.3); }
          .content { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
          .box { background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .field { margin-bottom: 10px; }
          .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
          .field-value { font-size: 15px; font-family: monospace; font-weight: 700; color: #38bdf8; word-break: break-all; margin-top: 2px; }
          .btn { display: block; text-align: center; background: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 24px; }
          .footer { margin-top: 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; pt: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${platformName}" class="logo" />` : ''}
            <h1 class="title">${platformName}</h1>
            <span class="badge">Conta de Cliente Ativada</span>
          </div>
          <div class="content">
            <p>Olá <strong>${name || 'Cliente'}</strong>,</p>
            <p>A sua conta foi gerada automaticamente na nossa plataforma para garantir que você tenha acesso imediato a todas as suas compras, conteúdos digitais e faturas.</p>
            
            <div class="box">
              <div class="field">
                <div class="field-label">Seu E-mail de Login:</div>
                <div class="field-value">${to}</div>
              </div>
              <div class="field" style="margin-bottom: 0;">
                <div class="field-label">Sua Palavra-passe de Acesso:</div>
                <div class="field-value" style="color: #34d399;">${temporaryPassword}</div>
              </div>
            </div>

            <p style="font-size: 13px; color: #94a3b8;">
              Poderá alterar esta senha a qualquer momento nas configurações do seu perfil de cliente.
            </p>

            ${
              loginUrl
                ? `<a href="${loginUrl}" class="btn">Aceder ao Meu Painel de Cliente</a>`
                : ''
            }
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${platformName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendSystemEmail({
    to,
    subject: `Sua Conta no ${platformName} foi Criada (Credenciais de Acesso)`,
    html,
    category: 'account_created',
  });
}

/**
 * Send payment instructions (MCX Express push or GPR reference)
 */
export async function sendPaymentInstructionsEmail(to: string, charge: Charge) {
  const settings = store.getPlatformSettings();
  const platformName = settings.platformName || 'Pay Yetux Angola';
  const isGpo = charge.method === 'GPO';
  const entity = charge.referenceEntity || charge.referenceDetails?.entity || '10111';
  const reference = charge.referenceNumber || charge.referenceDetails?.reference || '---';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; }
          .title { font-size: 20px; font-weight: 800; color: #ffffff; text-align: center; }
          .box { background: #020617; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
          .field-value { font-size: 18px; font-family: monospace; font-weight: 800; color: #34d399; margin-top: 4px; }
          .amount { font-size: 24px; font-weight: 900; color: #38bdf8; text-align: center; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">${isGpo ? 'Autorização Multicaixa Express' : 'Referência Multicaixa Emitida'}</h1>
          <p style="text-align: center; color: #94a3b8; font-size: 13px;">${charge.description || 'Pedido em processamento'}</p>
          
          <div class="amount">${new Intl.NumberFormat('pt-AO').format(charge.amount)} Kz</div>

          <div class="box">
            ${
              isGpo
                ? `
                <div style="text-align: center;">
                  <div class="field-label">Número Notificado via Push:</div>
                  <div class="field-value">${charge.phoneNumber || 'N/A'}</div>
                  <p style="font-size: 13px; color: #cbd5e1; margin-top: 10px;">
                    Abra o seu aplicativo <strong>Multicaixa Express</strong> no telemóvel e digite o seu PIN para aprovar.
                  </p>
                </div>
                `
                : `
                <div style="margin-bottom: 12px;">
                  <div class="field-label">Entidade:</div>
                  <div class="field-value">${entity}</div>
                </div>
                <div>
                  <div class="field-label">Referência de Pagamento:</div>
                  <div class="field-value">${reference}</div>
                </div>
                <p style="font-size: 13px; color: #cbd5e1; margin-top: 12px;">
                  Pague no Multicaixa Express (Pagamentos por Referência) ou em qualquer Caixa Automático ATM.
                </p>
                `
            }
          </div>
        </div>
      </body>
    </html>
  `;

  return sendSystemEmail({
    to,
    subject: `Instruções de Pagamento: ${charge.amount} Kz (${platformName})`,
    html,
    category: 'payment_reference',
  });
}

/**
 * Send payment receipt and download link upon payment completion
 */
export async function sendPaymentReceiptEmail(to: string, charge: Charge, digitalFileUrl?: string) {
  const settings = store.getPlatformSettings();
  const platformName = settings.platformName || 'Pay Yetux Angola';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; text-align: center; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #10b981; }
          .btn { display: block; text-align: center; background: #059669; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge">Pagamento Confirmado com Sucesso</span>
            <h1 class="title" style="margin-top: 12px;">Recibo de Pagamento</h1>
          </div>

          <p>Olá <strong>${charge.customerName || 'Cliente'}</strong>,</p>
          <p>Confirmamos a receção do seu pagamento de <strong>${new Intl.NumberFormat('pt-AO').format(charge.amount)} Kz</strong> relativo a <em>${charge.description || 'Infoproduto'}</em>.</p>

          ${
            digitalFileUrl
              ? `
              <div style="background: #020617; border: 1px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <h3 style="color: #34d399; margin: 0 0 8px 0; font-size: 16px;">O seu conteúdo digital está pronto para descarregar</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">Clique no botão abaixo para descarregar o seu infoproduto imediatamente:</p>
                <a href="${digitalFileUrl}" class="btn">Descarregar Meu Infoproduto</a>
              </div>
              `
              : ''
          }

          <p style="font-size: 13px; color: #94a3b8;">
            Aceda ao seu Portal de Cliente para consultar as suas faturas e histórico de compras.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendSystemEmail({
    to,
    subject: `Pagamento Aprovado: ${charge.description || 'Infoproduto'} (${platformName})`,
    html,
    category: 'payment_paid',
  });
}
