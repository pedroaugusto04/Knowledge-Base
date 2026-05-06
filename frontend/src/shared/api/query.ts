import type { QueryResponse } from './models/query';
import { request } from './request';

function normalizeLimit(limit: number | undefined) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return 5;
  return Math.min(Math.max(Math.trunc(limit), 1), 10);
}

export function runQuery(params: { query: string; projectSlug?: string; workspaceSlug?: string; mode?: 'search' | 'answer'; limit?: number; page?: number; pageSize?: number }) {
  const search = new URLSearchParams({
    query: params.query,
    mode: params.mode || 'answer',
    projectSlug: params.projectSlug || '',
    workspaceSlug: params.workspaceSlug || '',
    limit: String(normalizeLimit(params.limit)),
    page: String(params.page || 1),
    pageSize: String(params.pageSize || 10),
  });
  return request<QueryResponse>(`/api/query?${search.toString()}`);
}
