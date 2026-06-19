import type { CategoryRecord } from './models/category';
import type { CreateWorkspaceResponse } from './models/workspace';
import { request } from './request';

export function createWorkspace(params: { displayName: string; workspaceSlug?: string }) {
  return request<CreateWorkspaceResponse>('/api/workspaces', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function fetchWorkspaceCategories(workspaceSlug: string): Promise<CategoryRecord[]> {
  const result = await request<{ ok: true; categories: CategoryRecord[] }>(`/api/workspaces/${encodeURIComponent(workspaceSlug)}/categories`);
  return result.categories;
}
