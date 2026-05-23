import { DEFAULT_PAGE_SIZE } from './models/pagination';
import type { AskHistoryResponse, AskResponse } from './models/ask';
import { request } from './request';

export function runAsk(params: { question: string; projectSlug?: string }) {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export function fetchAskHistory(params: { page?: number; pageSize?: number; projectSlug?: string } = {}) {
  const search = new URLSearchParams({
    page: String(params.page || 1),
    pageSize: String(params.pageSize || DEFAULT_PAGE_SIZE),
  });
  if (params.projectSlug) search.set('projectSlug', params.projectSlug);
  return request<AskHistoryResponse>(`/api/ask/history?${search.toString()}`);
}
