import { HttpException, HttpStatus } from '@nestjs/common';

export class QuotaExceededException extends HttpException {
  constructor(resourceType: string, limit: number, current: number) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Quota Exceeded',
        message: `You have reached the limit of ${limit} for ${resourceType}. Current usage: ${current}.`,
        resourceType,
        limit,
        current,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
