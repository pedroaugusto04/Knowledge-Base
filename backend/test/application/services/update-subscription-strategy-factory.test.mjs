import test from 'node:test';
import assert from 'node:assert/strict';
import { UpdateSubscriptionStrategyFactory } from '../../../dist/application/services/billing/subscriptionStrategy/UpdateSubscriptionStrategyFactory.js';
import { SubscriptionChangeKind } from '../../../dist/application/services/billing/subscriptionStrategy/subscriptionChangeKind.js';
import { FREE_PLAN_ID, SubscriptionPlan } from '../../../dist/domain/enums/plans.enums.js';
import { BillingCycle } from '../../../dist/domain/enums/billing.enums.js';

test('UpdateSubscriptionStrategyFactory returns NEW when activeSub is missing or is free plan', () => {
  const factory = new UpdateSubscriptionStrategyFactory();

  // Case 1: activeSub is missing
  const ctxNoActiveSub = {
    userId: 'user-1',
    activeSub: undefined,
    newPlan: { id: 'pro-plan-id', slug: SubscriptionPlan.PRO, priceCents: 2000 },
    newBillingCycle: BillingCycle.MONTHLY,
  };
  assert.equal(factory.getChangeKind(ctxNoActiveSub), SubscriptionChangeKind.NEW);

  // Case 2: activeSub is present but is the free plan
  const ctxFreePlanSub = {
    userId: 'user-1',
    activeSub: {
      id: 'user-1',
      planId: FREE_PLAN_ID,
      billingCycle: BillingCycle.MONTHLY,
      gatewaySubscriptionId: '',
      nextDueDate: undefined,
      gatewayName: 'asaas',
    },
    activePlan: { id: FREE_PLAN_ID, slug: SubscriptionPlan.FREE, priceCents: 0 },
    newPlan: { id: 'pro-plan-id', slug: SubscriptionPlan.PRO, priceCents: 2000 },
    newBillingCycle: BillingCycle.MONTHLY,
  };
  assert.equal(factory.getChangeKind(ctxFreePlanSub), SubscriptionChangeKind.NEW);
});

test('UpdateSubscriptionStrategyFactory returns UPGRADE/DOWNGRADE/CHANGE_CYCLE between paid plans', () => {
  const factory = new UpdateSubscriptionStrategyFactory();

  const activeSub = {
    id: 'user-1',
    planId: 'pro-plan-id',
    billingCycle: BillingCycle.MONTHLY,
    gatewaySubscriptionId: 'sub-123',
    nextDueDate: undefined,
    gatewayName: 'asaas',
  };

  const proPlan = { id: 'pro-plan-id', slug: SubscriptionPlan.PRO, priceCents: 2000 };
  const enterprisePlan = { id: 'enterprise-plan-id', slug: SubscriptionPlan.ENTERPRISE, priceCents: 10000 };

  // Upgrade
  const ctxUpgrade = {
    userId: 'user-1',
    activeSub,
    activePlan: proPlan,
    newPlan: enterprisePlan,
    newBillingCycle: BillingCycle.MONTHLY,
  };
  assert.equal(factory.getChangeKind(ctxUpgrade), SubscriptionChangeKind.UPGRADE);

  // Downgrade
  const ctxDowngrade = {
    userId: 'user-1',
    activeSub,
    activePlan: enterprisePlan,
    newPlan: proPlan,
    newBillingCycle: BillingCycle.MONTHLY,
  };
  assert.equal(factory.getChangeKind(ctxDowngrade), SubscriptionChangeKind.DOWNGRADE);

  // Change Cycle
  const ctxChangeCycle = {
    userId: 'user-1',
    activeSub,
    activePlan: proPlan,
    newPlan: proPlan,
    newBillingCycle: BillingCycle.YEARLY,
  };
  assert.equal(factory.getChangeKind(ctxChangeCycle), SubscriptionChangeKind.CHANGE_CYCLE);
});
