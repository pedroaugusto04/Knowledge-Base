import { SubscriptionContext } from '../subscriptionContext.js';
import { UpdateSubscriptionStrategy, UpdateSubscriptionStrategyResult } from '../UpdateSubscriptionStrategy.js';
import type { SubscriptionService } from '../../SubscriptionService.js';
import { SubscriptionChangeKind } from '../subscriptionChangeKind.js';

export class NewSubscriptionStrategy implements UpdateSubscriptionStrategy {
  constructor(
    private readonly subscriptionService: SubscriptionService
  ) {}

  async execute(ctx: SubscriptionContext): Promise<UpdateSubscriptionStrategyResult> {
    return await this.subscriptionService.createNewSubscriptionPaymentFromContext(ctx);
  }
}
