import test from 'node:test';
import assert from 'node:assert/strict';
import { SubscriptionUpgradeService } from '../../../dist/application/services/billing/SubscriptionUpgradeService.js';
import { SubscriptionPlan } from '../../../dist/domain/enums/plans.enums.js';
import { BillingCycle } from '../../../dist/domain/enums/billing.enums.js';

test('SubscriptionUpgradeService prorates when upgrading between paid plans', async () => {
  const proPlan = {
    id: 'pro-plan-uuid',
    slug: SubscriptionPlan.PRO,
    displayName: 'Pro Plan',
    priceCents: 2000, // 20.00
    priceUsdCents: 2000,
  };

  const enterprisePlan = {
    id: 'enterprise-plan-uuid',
    slug: SubscriptionPlan.ENTERPRISE,
    displayName: 'Enterprise Plan',
    priceCents: 10000, // 100.00
    priceUsdCents: 10000,
  };

  // Mock Database with query counter
  let queryCount = 0;
  const mockDatabase = {
    getDb() {
      return {
        select() {
          return {
            from() {
              return {
                where(condition) {
                  const currentQuery = queryCount;
                  queryCount++;
                  return {
                    limit(num) {
                      return {
                        async then(callback) {
                          if (currentQuery === 0) {
                            return callback([proPlan]);
                          } else {
                            return callback([enterprisePlan]);
                          }
                        }
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const service = new SubscriptionUpgradeService(mockDatabase);

  // Upgrade from pro to enterprise. Today is exactly 15 days before periodEnd (out of 30 days cycle).
  // We add 10 seconds of extra buffer to counter milliseconds delta during test execution.
  // Remaining: exactly 15 days.
  // Delta price: (100 - 20) * 15/30 = 40.00.
  const periodEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 10000);

  const value = await service.calculateProrationUpgradeValue({
    currentPlanId: 'pro-plan-uuid',
    newPlanId: 'enterprise-plan-uuid',
    billingCycle: BillingCycle.MONTHLY,
    currentPeriodEnd: periodEnd,
  });

  // It should be prorated. (80 * 15 / 30 = 40.00)
  assert.equal(value, 40.00);
});
