import type { NoteStatus } from './note-status';

export type Reminder = {
  id: string;
  title: string;
  project: string;
  workspace?: string;
  status: NoteStatus;
  isOverdue: boolean;
  reminderDate: string;
  reminderTime: string;
  reminderAt: string;
  relativePath: string;
};
