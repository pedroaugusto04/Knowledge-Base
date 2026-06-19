import type { ProjectTemplate, CreateProjectTemplateInput, UpdateProjectTemplateInput, ApplyProjectTemplateInput, ApplyProjectTemplateResult } from './models/project-template.js';
import { request } from './request.js';

export async function fetchProjectTemplates(workspaceSlug: string, page = 1, pageSize = 10) {
  const search = new URLSearchParams({
    workspaceSlug,
    page: String(page),
    pageSize: String(pageSize),
  });
  return request<{ templates: ProjectTemplate[]; total: number }>(`/api/project-templates?${search.toString()}`);
}

export async function createProjectTemplate(input: CreateProjectTemplateInput) {
  return request<ProjectTemplate>('/api/project-templates', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateProjectTemplate(id: string, input: UpdateProjectTemplateInput) {
  return request<ProjectTemplate>(`/api/project-templates/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteProjectTemplate(id: string) {
  return request<{ ok: true }>(`/api/project-templates/${id}`, {
    method: 'DELETE',
  });
}

export async function applyProjectTemplate(input: ApplyProjectTemplateInput) {
  return request<ApplyProjectTemplateResult>('/api/project-templates/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
