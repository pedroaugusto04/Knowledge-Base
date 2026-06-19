export type ProjectTemplateField = {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number';
  placeholder?: string;
  options?: string[];
  required: boolean;
  defaultValue?: string;
  order: number;
};

export type ProjectTemplateFolder = {
  id: string;
  name: string;
  slug: string;
  order: number;
};

export type ProjectTemplate = {
  id: string;
  workspaceSlug: string;
  name: string;
  description: string;
  fields: ProjectTemplateField[];
  folders: ProjectTemplateFolder[];
  defaultTags: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectTemplateInput = {
  workspaceSlug: string;
  name: string;
  description: string;
  fields: Omit<ProjectTemplateField, 'id'>[];
  folders: Omit<ProjectTemplateFolder, 'id'>[];
  defaultTags: string[];
  isDefault?: boolean;
};

export type UpdateProjectTemplateInput = {
  id: string;
  name?: string;
  description?: string;
  fields?: Omit<ProjectTemplateField, 'id'>[];
  folders?: Omit<ProjectTemplateFolder, 'id'>[];
  defaultTags?: string[];
  isDefault?: boolean;
};

export type ProjectTemplateListResult = {
  templates: ProjectTemplate[];
  total: number;
};

export type ApplyProjectTemplateInput = {
  templateId: string;
  displayName: string;
  projectSlug: string;
  repositoryIds: string[];
  fieldValues?: Record<string, string>;
};
