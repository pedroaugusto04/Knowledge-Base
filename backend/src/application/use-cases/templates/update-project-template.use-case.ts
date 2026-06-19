import type { ProjectTemplateRepository } from '../../ports/templates/project-template.repository.js';
import type { UpdateProjectTemplateInput, ProjectTemplate } from '../../models/project-template.models.js';

export class UpdateProjectTemplateUseCase {
  constructor(private readonly projectTemplateRepository: ProjectTemplateRepository) {}

  async execute(input: UpdateProjectTemplateInput): Promise<ProjectTemplate> {
    const existing = await this.projectTemplateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Project template not found');
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      const existingDefault = await this.projectTemplateRepository.findDefault({
        workspaceSlug: existing.workspaceSlug,
      });
      
      if (existingDefault && existingDefault.id !== input.id) {
        await this.projectTemplateRepository.update({
          id: existingDefault.id,
          isDefault: false,
        });
      }
    }

    return await this.projectTemplateRepository.update(input);
  }
}
