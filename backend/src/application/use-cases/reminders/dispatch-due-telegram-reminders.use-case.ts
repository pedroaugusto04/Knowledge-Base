import { Injectable } from '@nestjs/common';

import { ReminderDeliveryChannel } from '../../../contracts/enums.js';
import { DispatchDueRemindersUseCase } from './dispatch-due-reminders.use-case.js';

@Injectable()
export class DispatchDueTelegramRemindersUseCase {
  constructor(private readonly dispatchDueReminders: DispatchDueRemindersUseCase) {}

  async execute(referenceNowIso?: string) {
    return this.dispatchDueReminders.execute(ReminderDeliveryChannel.Telegram, referenceNowIso);
  }
}
