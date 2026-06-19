import type { NoteTemplateRepository } from '../../ports/templates/note-template.repository.js';
import type { UpdateNoteTemplateInput, NoteTemplate } from '../../models/note-template.models.js';

export class UpdateNoteTemplateUseCase {
  constructor(private readonly noteTemplateRepository: NoteTemplateRepository) {}

  async execute(input: UpdateNoteTemplateInput): Promise<NoteTemplate> {
    const existing = await this.noteTemplateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Note template not found');
    }

    // If setting as default, unset other defaults for the same canonical type
    if (input.isDefault && input.canonicalType) {
      const existingDefault = await this.noteTemplateRepository.findDefault({
        workspaceSlug: existing.workspaceSlug,
        canonicalType: input.canonicalType,
      });
      
      if (existingDefault && existingDefault.id !== input.id) {
        await this.noteTemplateRepository.update({
          id: existingDefault.id,
          isDefault: false,
        });
      }
    }

    return await this.noteTemplateRepository.update(input);
  }
}
