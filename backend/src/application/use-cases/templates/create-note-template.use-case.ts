import type { NoteTemplateRepository } from '../../ports/templates/note-template.repository.js';
import type { CreateNoteTemplateInput, NoteTemplate } from '../../models/note-template.models.js';

export class CreateNoteTemplateUseCase {
  constructor(private readonly noteTemplateRepository: NoteTemplateRepository) {}

  async execute(input: CreateNoteTemplateInput): Promise<NoteTemplate> {
    const now = new Date().toISOString();
    
    // If this is set as default, unset other defaults for the same canonical type
    if (input.isDefault && input.canonicalType) {
      const existingDefault = await this.noteTemplateRepository.findDefault({
        workspaceSlug: input.workspaceSlug,
        canonicalType: input.canonicalType,
      });
      
      if (existingDefault) {
        await this.noteTemplateRepository.update({
          id: existingDefault.id,
          isDefault: false,
        });
      }
    }

    const template = await this.noteTemplateRepository.create({
      ...input,
      isDefault: input.isDefault || false,
    });

    return template;
  }
}
