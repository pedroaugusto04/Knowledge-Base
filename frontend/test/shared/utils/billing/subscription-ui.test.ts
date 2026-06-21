import { describe, expect, it } from 'vitest';

import { BILLING_TYPE } from '../../../../src/shared/constants/billing.constants';
import {
  canChooseManualMonthlyPayment,
  mergePendingPayment,
  pendingChargeStatus,
  resolveEffectiveMonthlyBillingType,
} from '../../../../src/shared/utils/billing/subscription-ui';
import type { PendingPaymentDTO } from '../../../../src/shared/api/billing';

describe('subscription-ui helpers', () => {
  it('forces credit card for monthly billing when a card is on file', () => {
    expect(
      resolveEffectiveMonthlyBillingType('monthly', true, BILLING_TYPE.PIX),
    ).toBe(BILLING_TYPE.CREDIT_CARD);
  });

  it('keeps selected billing type when no card is on file', () => {
    expect(
      resolveEffectiveMonthlyBillingType('monthly', false, BILLING_TYPE.PIX),
    ).toBe(BILLING_TYPE.PIX);
  });

  it('disables manual monthly payment when card is on file', () => {
    expect(canChooseManualMonthlyPayment(true)).toBe(false);
    expect(canChooseManualMonthlyPayment(false)).toBe(true);
  });

  it('treats pending and overdue as open charge statuses', () => {
    expect(pendingChargeStatus('pending')).toBe(true);
    expect(pendingChargeStatus('overdue')).toBe(true);
    expect(pendingChargeStatus('confirmed')).toBe(false);
  });

  it('mergePendingPayment keeps PIX data when incoming payload omits it', () => {
    const current: PendingPaymentDTO = {
      id: 'pay-1',
      subscriptionId: 'user-1',
      userId: 'user-1',
      gateway: 'asaas',
      gatewayPaymentId: 'gw-1',
      status: 'pending',
      billingType: 'pix',
      kind: 'upgrade',
      value: 20,
      dueDate: '2026-07-21T00:00:00Z',
      bankSlipUrl: null,
      pixQrCode: 'pix-copy-code',
      pixQrCodeUrl: 'data:image/png;base64,abc',
      invoiceUrl: null,
      canCancel: true,
    };

    const incoming: PendingPaymentDTO = {
      ...current,
      pixQrCode: null,
      pixQrCodeUrl: null,
    };

    const merged = mergePendingPayment(current, incoming);
    expect(merged.pixQrCode).toBe('pix-copy-code');
    expect(merged.pixQrCodeUrl).toBe('data:image/png;base64,abc');
  });
});
