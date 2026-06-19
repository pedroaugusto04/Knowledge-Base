import type { NoteTemplate, CreateNoteTemplateInput, UpdateNoteTemplateInput, ApplyNoteTemplateInput, ApplyNoteTemplateResult } from './models/note-template.js';
import { request } from './request.js';

export async function fetchNoteTemplates(workspaceSlug: string, page = 1, pageSize = 10) {
  const search = new URLSearchParams({
    workspaceSlug,
    page: String(page),
    pageSize: String(pageSize),
  });
  return request<{ templates: NoteTemplate[]; total: number }>(`/api/note-templates?${search.toString()}`);
}

export async function createNoteTemplate(input: CreateNoteTemplateInput) {
  return request<NoteTemplate>('/api/note-templates', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateNoteTemplate(id: string, input: UpdateNoteTemplateInput) {
  return request<NoteTemplate>(`/api/note-templates/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteNoteTemplate(id: string) {
  return request<{ ok: true }>(`/api/note-templates/${id}`, {
    method: 'DELETE',
  });
}

export async function applyNoteTemplate(input: ApplyNoteTemplateInput) {
  return request<ApplyNoteTemplateResult>('/api/note-templates/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
