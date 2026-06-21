import { PaymentStatus } from '../../persistence/schema/index.js';

export interface IGatewayStatusMapper {
  normalizeSubscriptionStatus(raw?: string | null): string | null;
  normalizePaymentStatus(rawStatus?: string | null, event?: string | null): PaymentStatus | null;
}
