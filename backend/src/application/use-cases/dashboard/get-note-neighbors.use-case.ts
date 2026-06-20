import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../../application/ports/notes/content.repository.js';

@Injectable()
export class GetNoteNeighborsUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(userId: string, id: string, projectSlug?: string, projectId?: string) {
    return this.contentRepository.getNoteNeighbors(userId, id, {
      projectId,
      projectSlug,
    });
  }
}
