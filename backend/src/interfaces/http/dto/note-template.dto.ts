import { z } from 'zod';

import { CanonicalType, KnowledgeStatus } from '../../../contracts/enums.js';
import { noteStatusValues } from '../../../domain/note-status.js';
import { optionalStringArraySchema } from './dto-normalizers.js';

const noteTemplateSectionSchema = z.object({
  title: z.string().trim().min(1, 'Section title is required').max(100, 'Use at most 100 characters.'),
  content: z.string().trim().max(10000, 'Use at most 10000 characters.').default(''),
  order: z.number().int().min(0).default(0),
  required: z.boolean().default(false),
});

const noteStatusSchema = z.enum(noteStatusValues).optional();
const canonicalTypeSchema = z.nativeEnum(CanonicalType).optional();

export const createNoteTemplateBodySchema = z
  .object({
    workspaceSlug: z.string().trim().min(1, 'Workspace slug is required'),
    name: z.string().trim().min(1, 'Template name is required').max(100, 'Use at most 100 characters.'),
    description: z.string().trim().max(500, 'Use at most 500 characters.').default(''),
    canonicalType: canonicalTypeSchema,
    defaultTags: optionalStringArraySchema(60, 'Use at most 60 characters.'),
    defaultStatus: noteStatusSchema,
    sections: z.array(noteTemplateSectionSchema).min(1, 'At least one section is required').max(20, 'Use at most 20 sections.'),
    isDefault: z.boolean().default(false),
  })
  .strict();

export type CreateNoteTemplateBody = z.infer<typeof createNoteTemplateBodySchema>;

export const updateNoteTemplateBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Template name is required').max(100, 'Use at most 100 characters.').optional(),
    description: z.string().trim().max(500, 'Use at most 500 characters.').optional(),
    canonicalType: canonicalTypeSchema,
    defaultTags: optionalStringArraySchema(60, 'Use at most 60 characters.').optional(),
    defaultStatus: noteStatusSchema.optional(),
    sections: z.array(noteTemplateSectionSchema).min(1, 'At most 20 sections.').max(20, 'Use at most 20 sections.').optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export type UpdateNoteTemplateBody = z.infer<typeof updateNoteTemplateBodySchema>;

export const noteTemplateIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type NoteTemplateIdParam = z.infer<typeof noteTemplateIdParamSchema>;

export const applyNoteTemplateBodySchema = z
  .object({
    templateId: z.string().trim().min(1, 'Template ID is required'),
    projectSlug: z.string().trim().min(1, 'Project slug is required'),
    folderId: z.string().trim().optional(),
    customTitle: z.string().trim().max(160, 'Use at most 160 characters.').optional(),
    customTags: optionalStringArraySchema(60, 'Use at most 60 characters.').optional(),
    customValues: z.record(z.string().trim()).optional(),
  })
  .strict();

export type ApplyNoteTemplateBody = z.infer<typeof applyNoteTemplateBodySchema>;

export const listNoteTemplatesQuerySchema = z.object({
  workspaceSlug: z.string().trim().min(1, 'Workspace slug is required'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListNoteTemplatesQuery = z.infer<typeof listNoteTemplatesQuerySchema>;
