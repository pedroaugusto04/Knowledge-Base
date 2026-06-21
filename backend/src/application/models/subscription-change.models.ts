import type { SubscriptionChangeKind } from '../../domain/enums/billing.enums.js';

export interface SubscriptionChangeResult {
  summary: unknown;
  changeKind: SubscriptionChangeKind;
}
