import type { NoteTemplateRepository } from '../../ports/templates/note-template.repository.js';

export class DeleteNoteTemplateUseCase {
  constructor(private readonly noteTemplateRepository: NoteTemplateRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.noteTemplateRepository.findById(id);
    if (!existing) {
      throw new Error('Note template not found');
    }

    await this.noteTemplateRepository.delete(id);
  }
}
