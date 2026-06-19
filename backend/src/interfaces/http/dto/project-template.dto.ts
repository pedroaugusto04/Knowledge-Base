import { z } from 'zod';

import { optionalStringArraySchema } from './dto-normalizers.js';

const projectTemplateFieldSchema = z.object({
  key: z.string().trim().min(1, 'Field key is required').max(50, 'Use at most 50 characters.'),
  label: z.string().trim().min(1, 'Field label is required').max(100, 'Use at most 100 characters.'),
  type: z.enum(['text', 'textarea', 'select', 'multiselect', 'date', 'number']),
  placeholder: z.string().trim().max(200, 'Use at most 200 characters.').optional(),
  options: z.array(z.string().trim().max(100)).optional(),
  required: z.boolean().default(false),
  defaultValue: z.string().trim().optional(),
  order: z.number().int().min(0).default(0),
});

const projectTemplateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100, 'Use at most 100 characters.'),
  slug: z.string().trim().min(1, 'Folder slug is required').max(100, 'Use at most 100 characters.'),
  order: z.number().int().min(0).default(0),
});

export const createProjectTemplateBodySchema = z
  .object({
    workspaceSlug: z.string().trim().min(1, 'Workspace slug is required'),
    name: z.string().trim().min(1, 'Template name is required').max(100, 'Use at most 100 characters.'),
    description: z.string().trim().max(500, 'Use at most 500 characters.').default(''),
    fields: z.array(projectTemplateFieldSchema).max(30, 'Use at most 30 fields.').default([]),
    folders: z.array(projectTemplateFolderSchema).max(20, 'Use at most 20 folders.').default([]),
    defaultTags: optionalStringArraySchema(60, 'Use at most 60 characters.'),
    isDefault: z.boolean().default(false),
  })
  .strict();

export type CreateProjectTemplateBody = z.infer<typeof createProjectTemplateBodySchema>;

export const updateProjectTemplateBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Template name is required').max(100, 'Use at most 100 characters.').optional(),
    description: z.string().trim().max(500, 'Use at most 500 characters.').optional(),
    fields: z.array(projectTemplateFieldSchema).max(30, 'Use at most 30 fields.').optional(),
    folders: z.array(projectTemplateFolderSchema).max(20, 'Use at most 20 folders.').optional(),
    defaultTags: optionalStringArraySchema(60, 'Use at most 60 characters.').optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateProjectTemplateBody = z.infer<typeof updateProjectTemplateBodySchema>;

export const projectTemplateIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type ProjectTemplateIdParam = z.infer<typeof projectTemplateIdParamSchema>;

export const applyProjectTemplateBodySchema = z
  .object({
    templateId: z.string().trim().min(1, 'Template ID is required'),
    displayName: z.string().trim().min(1, 'Display name is required').max(100, 'Use at most 100 characters.'),
    projectSlug: z.string().trim().min(1, 'Project slug is required'),
    repositoryIds: z.array(z.string().trim()).default([]),
    fieldValues: z.record(z.string().trim()).optional(),
  })
  .strict();

export type ApplyProjectTemplateBody = z.infer<typeof applyProjectTemplateBodySchema>;

export const listProjectTemplatesQuerySchema = z.object({
  workspaceSlug: z.string().trim().min(1, 'Workspace slug is required'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListProjectTemplatesQuery = z.infer<typeof listProjectTemplatesQuerySchema>;
