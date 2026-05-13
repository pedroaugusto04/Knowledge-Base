import { Injectable } from '@nestjs/common';

import { readEnvironment } from './environment.js';
import { WhatsappMediaDownloader, type WhatsappMediaDownloadResult } from '../application/ports/whatsapp-media.downloader.js';
import { WhatsappReplySender, type WhatsappSendTextResult } from '../application/ports/whatsapp-reply.sender.js';

@Injectable()
export class EvolutionWhatsappReplySender extends WhatsappReplySender {
  async sendText(input: { groupJid: string; text: string }): Promise<WhatsappSendTextResult> {
    const environment = readEnvironment();
    if (!environment.evolutionApiUrl || !environment.evolutionApiKey || !environment.evolutionInstanceName) {
      return { ok: false, error: 'evolution_api_not_configured' };
    }

    const normalizedText = String(input.text || '').trim() || 'Nao consegui montar a resposta. Tente novamente.';
    const baseUrl = environment.evolutionApiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/message/sendText/${encodeURIComponent(environment.evolutionInstanceName)}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: environment.evolutionApiKey,
        },
        body: JSON.stringify({
          number: input.groupJid,
          text: normalizedText,
        }),
      });
      if (!response.ok) return { ok: false, error: `evolution_api_http_${response.status}` };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

@Injectable()
export class EvolutionWhatsappMediaDownloader extends WhatsappMediaDownloader {
  async downloadBase64(input: { body: Record<string, unknown> }): Promise<WhatsappMediaDownloadResult> {
    const environment = readEnvironment();
    if (!environment.evolutionApiUrl || !environment.evolutionApiKey || !environment.evolutionInstanceName) {
      return { ok: false, error: 'evolution_api_not_configured' };
    }

    const baseUrl = environment.evolutionApiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/chat/getBase64FromMediaMessage/${encodeURIComponent(environment.evolutionInstanceName)}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: environment.evolutionApiKey,
        },
        body: JSON.stringify({ message: evolutionMessagePayload(input.body) }),
      });
      if (!response.ok) return { ok: false, error: `evolution_api_http_${response.status}` };
      const json = await response.json() as Record<string, unknown>;
      const dataBase64 = String(json.base64 || json.dataBase64 || json.media_data_b64 || '').trim();
      return dataBase64 ? { ok: true, dataBase64 } : { ok: false, error: 'evolution_media_base64_missing' };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

function evolutionMessagePayload(body: Record<string, unknown>): Record<string, unknown> {
  const data = body.data;
  if (Array.isArray(data)) {
    const first = data.find((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
    return first ? first as Record<string, unknown> : body;
  }
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return body;
}
