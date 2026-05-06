export type ReminderView = {
  id: string;
  title: string;
  project: string;
  workspace: string;
  status: string;
  reminderDate: string;
  reminderTime: string;
  reminderAt: string;
  relativePath: string;
};

export type DueTelegramReminderView = {
  userId: string;
  workspaceSlug: string;
  telegramChatId: string;
  reminderId: string;
  title: string;
  project: string;
  relativePath: string;
  status: string;
  scheduledAt: string;
};
