import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module.js';
import { AuthModule } from './auth.module.js';
import { SubscriptionController } from '../../interfaces/http/controllers/subscription/subscription.controller.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
  ],
  controllers: [
    SubscriptionController,
  ],
})
export class QuotaModule {}
