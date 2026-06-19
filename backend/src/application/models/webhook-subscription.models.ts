import type { WebhookTrigger } from '../../contracts/enums.js';

export type WebhookSubscriptionRecord = {
  id: string;
  userId: string;
  workspaceId: string;
  label: string;
  url: string;
  secret: string | null;
  events: WebhookTrigger[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
