import type { NoteTemplateRepository } from '../../ports/templates/note-template.repository.js';
import type { ApplyNoteTemplateInput, NoteTemplate } from '../../models/note-template.models.js';
import type { CreateManualNoteInput } from '../../models/note-input.models.js';

export class ApplyNoteTemplateUseCase {
  constructor(private readonly noteTemplateRepository: NoteTemplateRepository) {}

  async execute(input: ApplyNoteTemplateInput): Promise<{
    template: NoteTemplate;
    noteInput: CreateManualNoteInput;
  }> {
    const template = await this.noteTemplateRepository.findById(input.templateId);
    if (!template) {
      throw new Error('Note template not found');
    }

    // Build sections content
    let rawText = '';
    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);
    
    for (const section of sortedSections) {
      rawText += `## ${section.title}\n\n`;
      
      // Apply custom values if provided
      if (input.customValues && input.customValues[section.id]) {
        rawText += input.customValues[section.id];
      } else {
        rawText += section.content;
      }
      
      rawText += '\n\n';
    }

    const noteInput: CreateManualNoteInput = {
      projectSlug: input.projectSlug,
      folderId: input.folderId,
      title: input.customTitle || template.name,
      rawText: rawText.trim(),
      tags: input.customTags || template.defaultTags,
      status: template.defaultStatus,
      canonicalType: template.canonicalType,
      reminderDate: '',
      reminderTime: '',
    };

    return {
      template,
      noteInput,
    };
  }
}
