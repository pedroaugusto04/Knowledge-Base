import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from '../../ports/notes/content.repository.js';

type Input = { noteId: string; action: 'none' | 'resolved' | 'archived'; afterHours?: number | null };

@Injectable()
export class SetNoteAutoActionUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
  ) {}

  async execute(userId: string, input: Input) {
    const note = await this.contentRepository.getNoteById(userId, input.noteId);
    if (!note) throw new NotFoundException('note_not_found');

    const updated = await this.contentRepository.updateNote(userId, {
      id: note.id,
      folderId: note.folderId ?? undefined,
      title: note.title,
      rawText: note.markdown || '',
      tags: note.tags,
      status: note.status,
      categoryIds: note.categories ? note.categories.map((c) => c.id) : [],
      reminderDate: note.reminderDate,
      reminderTime: note.reminderAt,
      autoAction: input.action,
      autoAfterHours: input.afterHours ?? null,
    } as any);

    // scheduling is handled by the global batch worker

    return { ok: true as const, noteId: updated.id };
  }
}
