import type { ProjectTemplateRepository } from '../../ports/templates/project-template.repository.js';
import type { ProjectTemplateListResult } from '../../models/project-template.models.js';

export class ListProjectTemplatesUseCase {
  constructor(private readonly projectTemplateRepository: ProjectTemplateRepository) {}

  async execute(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<ProjectTemplateListResult> {
    const result = await this.projectTemplateRepository.findByWorkspace(input);
    
    return {
      templates: result.items,
      total: result.pagination.total,
    };
  }
}
