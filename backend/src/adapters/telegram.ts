import { Injectable } from '@nestjs/common';

import { readEnvironment } from './environment.js';
import { TelegramMessageSender, type TelegramSendTextResult } from '../application/ports/telegram-message.sender.js';

@Injectable()
export class TelegramHttpMessageSender extends TelegramMessageSender {
  async sendText(input: { chatId: string; text: string }): Promise<TelegramSendTextResult> {
    const environment = readEnvironment();
    if (!environment.telegramBotToken) {
      return { ok: false, error: 'telegram_bot_token_not_configured' };
    }

    const url = `https://api.telegram.org/bot${environment.telegramBotToken}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: input.chatId,
          text: input.text,
        }),
      });
      if (!response.ok) return { ok: false, error: `telegram_api_http_${response.status}` };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
