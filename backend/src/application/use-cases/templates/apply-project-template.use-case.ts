import type { ProjectTemplateRepository } from '../../ports/templates/project-template.repository.js';
import type { ApplyProjectTemplateInput, ProjectTemplate } from '../../models/project-template.models.js';
import type { CreateProjectInput } from '../../models/project-input.models.js';

export class ApplyProjectTemplateUseCase {
  constructor(private readonly projectTemplateRepository: ProjectTemplateRepository) {}

  async execute(input: ApplyProjectTemplateInput): Promise<{
    template: ProjectTemplate;
    projectInput: CreateProjectInput;
  }> {
    const template = await this.projectTemplateRepository.findById(input.templateId);
    if (!template) {
      throw new Error('Project template not found');
    }

    // Build tags from template and field values
    const tags = [...template.defaultTags];
    
    // Add field values as tags if they're meaningful
    if (input.fieldValues) {
      Object.entries(input.fieldValues).forEach(([key, value]) => {
        if (value && value.trim()) {
          tags.push(`${key}:${value.trim()}`);
        }
      });
    }

    const projectInput: CreateProjectInput = {
      displayName: input.displayName,
      projectSlug: input.projectSlug,
      repositoryIds: input.repositoryIds,
      defaultTags: tags,
    };

    return {
      template,
      projectInput,
    };
  }
}
