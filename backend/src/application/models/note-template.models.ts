export type NoteTemplateSection = {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
};

export type NoteTemplate = {
  id: string;
  workspaceSlug: string;
  name: string;
  description: string;
  canonicalType?: string;
  defaultTags: string[];
  defaultStatus?: string;
  sections: NoteTemplateSection[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteTemplateInput = {
  workspaceSlug: string;
  name: string;
  description: string;
  canonicalType?: string;
  defaultTags: string[];
  defaultStatus?: string;
  sections: Omit<NoteTemplateSection, 'id'>[];
  isDefault?: boolean;
};

export type UpdateNoteTemplateInput = {
  id: string;
  name?: string;
  description?: string;
  canonicalType?: string;
  defaultTags?: string[];
  defaultStatus?: string;
  sections?: Omit<NoteTemplateSection, 'id'>[];
  isDefault?: boolean;
};

export type NoteTemplateListResult = {
  templates: NoteTemplate[];
  total: number;
};

export type ApplyNoteTemplateInput = {
  templateId: string;
  projectSlug: string;
  folderId?: string;
  customTitle?: string;
  customTags?: string[];
  customValues?: Record<string, string>;
};
