import type { ProjectTemplateRepository } from '../../ports/templates/project-template.repository.js';

export class DeleteProjectTemplateUseCase {
  constructor(private readonly projectTemplateRepository: ProjectTemplateRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.projectTemplateRepository.findById(id);
    if (!existing) {
      throw new Error('Project template not found');
    }

    await this.projectTemplateRepository.delete(id);
  }
}
