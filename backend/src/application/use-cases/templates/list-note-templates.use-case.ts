import type { NoteTemplateRepository } from '../../ports/templates/note-template.repository.js';
import type { NoteTemplateListResult } from '../../models/note-template.models.js';

export class ListNoteTemplatesUseCase {
  constructor(private readonly noteTemplateRepository: NoteTemplateRepository) {}

  async execute(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<NoteTemplateListResult> {
    const result = await this.noteTemplateRepository.findByWorkspace(input);
    
    return {
      templates: result.items,
      total: result.pagination.total,
    };
  }
}
