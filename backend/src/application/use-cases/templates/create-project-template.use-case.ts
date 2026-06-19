import type { ProjectTemplateRepository } from '../../ports/templates/project-template.repository.js';
import type { CreateProjectTemplateInput, ProjectTemplate } from '../../models/project-template.models.js';

export class CreateProjectTemplateUseCase {
  constructor(private readonly projectTemplateRepository: ProjectTemplateRepository) {}

  async execute(input: CreateProjectTemplateInput): Promise<ProjectTemplate> {
    const now = new Date().toISOString();
    
    // If this is set as default, unset other defaults
    if (input.isDefault) {
      const existingDefault = await this.projectTemplateRepository.findDefault({
        workspaceSlug: input.workspaceSlug,
      });
      
      if (existingDefault) {
        await this.projectTemplateRepository.update({
          id: existingDefault.id,
          isDefault: false,
        });
      }
    }

    const template = await this.projectTemplateRepository.create({
      ...input,
      isDefault: input.isDefault || false,
    });

    return template;
  }
}
