import test from 'node:test';
import assert from 'node:assert/strict';

import { ReminderDeliveryChannel } from '../../dist/contracts/enums.js';
import { TelegramHttpMessageSender } from '../../dist/adapters/telegram.js';
import { TelegramReminderDeliveryGateway } from '../../dist/adapters/telegram.js';

test('telegram sender posts sendMessage with bot token and workspace chat id', async () => {
  process.env.KB_TELEGRAM_BOT_TOKEN = 'bot-token';
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    const sender = new TelegramHttpMessageSender();
    const result = await sender.sendText({ chatId: 'workspace-chat-1', text: 'Reminder text' });

    assert.equal(result.ok, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.telegram.org/botbot-token/sendMessage');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      chat_id: 'workspace-chat-1',
      text: 'Reminder text',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('telegram reminder delivery gateway maps unified reminder payload to telegram sender', async () => {
  const gateway = new TelegramReminderDeliveryGateway({
    sendText: async (input) => ({ ok: input.chatId === 'workspace-chat-1', error: input.chatId ? undefined : 'missing_chat' }),
  });

  const result = await gateway.sendText({
    channel: ReminderDeliveryChannel.Telegram,
    recipientId: 'workspace-chat-1',
    text: 'Reminder text',
    workspaceSlug: 'default',
    userId: 'user-1',
  });

  assert.equal(result.ok, true);
  assert.equal(result.error, undefined);
});
