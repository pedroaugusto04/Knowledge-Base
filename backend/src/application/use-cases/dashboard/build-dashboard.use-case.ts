import { Injectable } from '@nestjs/common';
import { ReminderDispatchMode } from '../../../contracts/enums.js';

import { ContentQueryRepository, ContentRepository } from '../../ports/content.repository.js';
import { ReminderDispatchRepository } from '../../ports/workflow-state.repository.js';
import { buildDashboardHome } from '../../utils/dashboard-home.utils.js';
import { reminderDispatchKey, resolveReminderScheduledAt } from '../reminders/reminder-schedule.js';
import { resolveReminderListStatus } from '../reminders/reminder-status.js';

export { buildDashboardHome };

@Injectable()
export class BuildDashboardUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly contentQueryRepository: ContentQueryRepository,
    private readonly reminderDispatchRepository: ReminderDispatchRepository,
  ) {}

  async execute(userId: string) {
    const [workspaces, projects, notes, reviews, rawReminders] = await Promise.all([
      this.contentRepository.listWorkspaces(userId),
      this.contentRepository.listProjects(userId),
      this.contentQueryRepository.list(userId),
      this.contentQueryRepository.listReviews(userId),
      this.contentQueryRepository.listReminders(userId),
    ]);
    const reminders = await Promise.all(
      rawReminders.map(async (reminder) => {
        const scheduledAt = resolveReminderScheduledAt(reminder);
        const dispatchKey = reminderDispatchKey(scheduledAt);
        const sent = dispatchKey
          ? await this.reminderDispatchRepository.hasSent(
            userId,
            reminder.workspace,
            ReminderDispatchMode.Exact,
            dispatchKey,
            reminder.id,
          )
          : false;

        return {
          ...reminder,
          status: resolveReminderListStatus({ ...reminder, sent }),
        };
      }),
    );
    return { workspaces, projects, home: buildDashboardHome(projects, notes, reviews, reminders) };
  }
}
