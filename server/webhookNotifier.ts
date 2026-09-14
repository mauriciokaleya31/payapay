import crypto from 'crypto';
import { Charge, ClientApp } from './types.js';
import { store } from './store.js';

export async function dispatchClientWebhook(charge: Charge, app: ClientApp, eventName: 'charge.paid' | 'charge.failed' | 'charge.pending') {
  if (!app.webhookUrl) {
    return;
  }

  // Check if app has subscribed to this event
  if (app.webhookEvents && app.webhookEvents.length > 0 && !app.webhookEvents.includes(eventName)) {
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    event: eventName,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    data: {
      id: charge.id,
      merchant_transaction_id: charge.merchantTransactionId,
      provider_charge_id: charge.providerChargeId,
      amount: charge.amount,
      currency: charge.currency || 'AOA',
      method: charge.method,
      status: charge.status,
      paid_at: charge.paidAt,
      customer: {
        name: charge.customerName,
        email: charge.customerEmail,
        phone: charge.phoneNumber,
      },
      reference_details: charge.referenceDetails,
    },
  };

  const rawBody = JSON.stringify(payload);
  const secret = app.webhookSecret || 'whsec_default';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const signatureHeader = `t=${timestamp},v1=${signature}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(app.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gateway-signature': signatureHeader,
        'User-Agent': 'GatewayPagamentos-Webhook/1.0',
      },
      body: rawBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await response.text().catch(() => '');

    store.addLog({
      type: 'webhook_dispatched',
      title: `Webhook ${eventName} entregue a ${app.name}`,
      details: `URL: ${app.webhookUrl} | HTTP Status: ${response.status}`,
      endpoint: app.webhookUrl,
      statusCode: response.status,
      success: response.ok,
      chargeId: charge.id,
      appId: app.id,
      payload,
      response: responseText.substring(0, 500),
    });
  } catch (err: any) {
    store.addLog({
      type: 'webhook_dispatched',
      title: `Falha no envio de Webhook (${eventName}) para ${app.name}`,
      details: `URL: ${app.webhookUrl} | Erro: ${err.message}`,
      endpoint: app.webhookUrl,
      statusCode: 0,
      success: false,
      chargeId: charge.id,
      appId: app.id,
      payload,
    });
  }
}

export async function testWebhookEndpoint(url: string, secret: string, eventName = 'charge.paid') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = {
    event: eventName,
    id: `evt_test_${Date.now()}`,
    created_at: new Date().toISOString(),
    is_test: true,
    data: {
      id: `ch_test_${Math.random().toString(36).substring(2, 8)}`,
      merchant_transaction_id: `tx-test-${Date.now()}`,
      amount: 15000,
      currency: 'AOA',
      method: 'GPO',
      status: 'paid',
      paid_at: new Date().toISOString(),
      customer: {
        name: 'Cliente de Teste',
        email: 'teste@gateway.ao',
        phone: '923000000',
      },
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const signatureHeader = `t=${timestamp},v1=${signature}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gateway-signature': signatureHeader,
        'User-Agent': 'GatewayPagamentos-Webhook/1.0',
      },
      body: rawBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;
    const body = await res.text().catch(() => '');

    return {
      success: res.ok,
      statusCode: res.status,
      latencyMs,
      responseBody: body.substring(0, 500),
      signatureHeader,
      payload,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 0,
      latencyMs: Date.now() - start,
      responseBody: err.message,
      signatureHeader,
      payload,
    };
  }
}
