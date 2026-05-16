import { Injectable } from '@nestjs/common';

import { RuntimeEnvironmentProvider } from '../../ports/runtime-environment.port.js';
import { buildPaginationMeta } from '../../../contracts/pagination.js';
import type { ListRemindersInput } from '../../models/reminder-list.models.js';
import { ContentQueryRepository } from '../../ports/content.repository.js';
import { enrichReminderStatus } from './reminder-status.js';

@Injectable()
export class ListPaginatedRemindersUseCase {
  constructor(
    private readonly contentQueryRepository: ContentQueryRepository,
    private readonly environmentProvider: RuntimeEnvironmentProvider,
  ) {}

  async execute(userId: string, input: ListRemindersInput) {
    const now = new Date();
    const reminders = (await this.contentQueryRepository.listReminders(userId))
      .map((reminder) => enrichReminderStatus(reminder, now))
      .filter((reminder) => !input.workspaceSlug || reminder.workspace === input.workspaceSlug)
      .filter((reminder) => !input.status || reminder.status === input.status);
    const pagination = buildPaginationMeta({ page: input.page, pageSize: input.pageSize }, reminders.length);
    const start = (pagination.page - 1) * pagination.pageSize;
    return { items: reminders.slice(start, start + pagination.pageSize), pagination };
  }
}
