export type CreateManualNoteInput = {
  projectSlug: string;
  title: string;
  rawText: string;
  tags: string[];
  reminderDate: string;
  reminderTime: string;
  reminderAt?: string;
};

export type UpdateManualNoteInput = {
  id: string;
  title: string;
  rawText: string;
  tags: string[];
  reminderDate: string;
  reminderTime: string;
  reminderAt?: string;
};
