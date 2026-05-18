export type WhatsappSendTextResult = {
  ok: boolean;
  error?: string;
};

export abstract class WhatsappReplySender {
  abstract sendText(input: { chatJid: string; text: string }): Promise<WhatsappSendTextResult>;
}
