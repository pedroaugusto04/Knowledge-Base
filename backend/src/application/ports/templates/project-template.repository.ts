import type { PaginatedResult } from '../../../contracts/pagination.js';
import type {
  CreateProjectTemplateInput,
  ProjectTemplate,
  UpdateProjectTemplateInput,
} from '../../models/project-template.models.js';

export interface ProjectTemplateRepository {
  create(input: CreateProjectTemplateInput): Promise<ProjectTemplate>;
  findById(id: string): Promise<ProjectTemplate | null>;
  findByWorkspace(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResult<ProjectTemplate>>;
  update(input: UpdateProjectTemplateInput): Promise<ProjectTemplate>;
  delete(id: string): Promise<void>;
  findDefault(input: {
    workspaceSlug: string;
  }): Promise<ProjectTemplate | null>;
}
