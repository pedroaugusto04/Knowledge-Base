import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from '../../ports/notes/content.repository.js';

@Injectable()
export class SetNotePinnedUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(userId: string, id: string, pinned: boolean) {
    const note = await this.contentRepository.getNoteById(userId, id);
    if (!note) throw new NotFoundException('note_not_found');

    const updated = await this.contentRepository.setNotePinned(userId, id, pinned);
    return { ok: true as const, noteId: id, pinned: updated?.isPinned ?? pinned };
  }
}
