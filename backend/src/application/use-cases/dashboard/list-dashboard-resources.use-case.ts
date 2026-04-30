import { Injectable } from '@nestjs/common';

import { ContentQueryRepository, ContentRepository } from '../../ports/content.repository.js';

@Injectable()
export class ListProjectsUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(userId: string) {
    return this.contentRepository.listProjects(userId);
  }
}

@Injectable()
export class ListWorkspacesUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(userId: string) {
    return this.contentRepository.listWorkspaces(userId);
  }
}

@Injectable()
export class ListNotesUseCase {
  constructor(private readonly contentQueryRepository: ContentQueryRepository) {}

  async execute(userId: string) {
    return this.contentQueryRepository.list(userId);
  }
}
