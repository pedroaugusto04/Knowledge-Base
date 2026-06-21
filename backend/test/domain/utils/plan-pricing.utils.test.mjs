import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlanPriceCentsForGateway, resolvePlanValueForCycle } from '../../../dist/domain/utils/plan-pricing.utils.js';
import { BillingCycle } from '../../../dist/domain/enums/billing.enums.js';
import { GatewayNameEnum } from '../../../dist/infrastructure/billing/gateways/IPaymentGateway.js';

test('resolvePlanPriceCentsForGateway uses BRL for Asaas and USD for Stripe', () => {
  const plan = { priceCents: 2000, priceUsdCents: 499 };

  assert.equal(resolvePlanPriceCentsForGateway(plan, GatewayNameEnum.ASAAS), 2000);
  assert.equal(resolvePlanPriceCentsForGateway(plan, GatewayNameEnum.STRIPE), 499);
});

test('resolvePlanValueForCycle applies yearly discount on gateway-specific price', () => {
  const plan = { priceCents: 2000, priceUsdCents: 499 };

  assert.equal(resolvePlanValueForCycle(plan, BillingCycle.MONTHLY, GatewayNameEnum.STRIPE), 4.99);
  assert.equal(resolvePlanValueForCycle(plan, BillingCycle.YEARLY, GatewayNameEnum.STRIPE), 47.904);
});
