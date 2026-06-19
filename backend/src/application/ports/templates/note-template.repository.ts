import type { PaginatedResult } from '../../../contracts/pagination.js';
import type {
  CreateNoteTemplateInput,
  NoteTemplate,
  UpdateNoteTemplateInput,
} from '../../models/note-template.models.js';

export interface NoteTemplateRepository {
  create(input: CreateNoteTemplateInput): Promise<NoteTemplate>;
  findById(id: string): Promise<NoteTemplate | null>;
  findByWorkspace(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResult<NoteTemplate>>;
  update(input: UpdateNoteTemplateInput): Promise<NoteTemplate>;
  delete(id: string): Promise<void>;
  findDefault(input: {
    workspaceSlug: string;
    canonicalType?: string;
  }): Promise<NoteTemplate | null>;
}
