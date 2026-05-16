import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { fetchNote } from './client';
import type { NoteDetail } from './models/note';

export function noteDetailQueryKey(noteId: string) {
  return ['note', noteId] as const;
}

export function noteDetailQueryOptions(noteId: string) {
  return queryOptions({
    queryKey: noteDetailQueryKey(noteId),
    queryFn: () => fetchNote(noteId),
    enabled: Boolean(noteId),
  });
}

export function getCachedNoteDetail(queryClient: QueryClient, noteId: string) {
  return noteId ? queryClient.getQueryData<NoteDetail>(noteDetailQueryKey(noteId)) : undefined;
}

export function ensureNoteDetail(queryClient: QueryClient, noteId: string) {
  return queryClient.ensureQueryData(noteDetailQueryOptions(noteId));
}

export async function invalidateNoteRelatedQueries(queryClient: QueryClient, noteId = '') {
  await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  await queryClient.invalidateQueries({ queryKey: ['notes'] });
  await queryClient.invalidateQueries({ queryKey: ['reminders'] });
  await queryClient.invalidateQueries({ queryKey: ['search'] });
  await queryClient.invalidateQueries({ queryKey: ['search-notes'] });
  await queryClient.invalidateQueries({ queryKey: ['project-folders'] });
  if (noteId) {
    await queryClient.invalidateQueries({ queryKey: noteDetailQueryKey(noteId) });
  }
}
