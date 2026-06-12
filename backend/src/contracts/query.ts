import { z } from 'zod';

import { paginationInputSchema } from './pagination.js';
import { noteStatusValues } from '../domain/note-status.js';
import { slugify } from '../domain/strings.js';

const queryNoteStatusValues = ['', 'open', ...noteStatusValues] as const;

export const queryInputSchema = z
  .object({
    query: z.string().min(1),
    workspaceSlug: z.string().default(''),
    projectSlug: z.string().default(''),
    status: z.enum(queryNoteStatusValues).default('open'),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .merge(paginationInputSchema)
  .transform((input) => ({
    ...input,
    workspaceSlug: slugify(input.workspaceSlug),
    projectSlug: slugify(input.projectSlug),
    status: input.status.trim().toLowerCase(),
  }));

export type QueryInput = z.infer<typeof queryInputSchema>;
