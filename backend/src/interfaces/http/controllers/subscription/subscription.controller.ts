import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../../../application/auth.js';
import { CurrentUser } from '../../auth.decorators.js';
import { AccessTokenAuthGuard } from '../../auth.guards.js';
import { QuotaService } from '../../../../application/services/quota.service.js';

@ApiTags('Subscription')
@Controller('api/subscription')
@UseGuards(AccessTokenAuthGuard)
export class SubscriptionController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription and quota status' })
  @ApiResponse({ status: 200, description: 'Quota status retrieved successfully' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.quotaService.getQuotaStatus(user.id);
  }
}
