import { Injectable } from '@nestjs/common';
import { SubscriptionChangeKind } from '../../../../domain/enums/billing.enums.js';
import { SubscriptionContext } from './subscriptionContext.js';
import { compareMoney, PLAN_PRICE_SCALE } from '../../../../infrastructure/utils/money.js';

@Injectable()
export class UpdateSubscriptionStrategyFactory {
  getChangeKind(ctx: SubscriptionContext): SubscriptionChangeKind {
    const activeSub = ctx.activeSub;

    if (!activeSub) {
      return SubscriptionChangeKind.NEW;
    }

    const priceComparison = compareMoney(
      ctx.activePlan?.priceCents ?? 0,
      ctx.newPlan?.priceCents ?? 0,
      PLAN_PRICE_SCALE,
    );

    if (activeSub.billingCycle !== ctx.newBillingCycle) {
      return SubscriptionChangeKind.CHANGE_CYCLE;
    }

    if (priceComparison < 0) {
      return SubscriptionChangeKind.UPGRADE;
    }

    return SubscriptionChangeKind.DOWNGRADE;
  }
}
