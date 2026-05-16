import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNote } from '../../shared/api/client';
import type { NoteDetail, NoteSummary } from '../../shared/api/models/note';
import type { QuickNoteStatus } from '../../shared/api/models/note-status';
import { ensureNoteDetail, invalidateNoteRelatedQueries } from '../../shared/api/note-query';
import { notifyGeneralFormError } from '../../shared/forms/errors';
import { notifySuccess } from '../../shared/ui/notifications';

type QuickStatusNote = Pick<NoteSummary, 'id' | 'title' | 'status' | 'project' | 'tags'> & {
  isOverdue?: boolean;
  editor?: NoteDetail['editor'];
};

export function QuickNoteStatusActions({
  note,
  compact = false,
}: {
  note: QuickStatusNote;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (status: QuickNoteStatus) => {
      const detail = note.editor ? note : await ensureNoteDetail(queryClient, note.id);
      return updateNote(note.id, {
        title: detail.title,
        rawText: detail.editor?.rawText || detail.title,
        tags: detail.tags,
        reminderDate: detail.editor?.reminderDate || '',
        reminderTime: detail.editor?.reminderTime || '',
        status,
      });
    },
    onSuccess: async (_result, status) => {
      notifySuccess(status === 'resolved' ? 'Nota resolvida.' : 'Nota arquivada.');
      await invalidateNoteRelatedQueries(queryClient, note.id);
    },
    onError: (error) => notifyGeneralFormError(error, 'Nao foi possivel atualizar o status da nota.'),
  });

  if (note.status === 'resolved' || note.status === 'archived') return null;

  return (
    <div className={`quick-note-status-actions${compact ? ' compact' : ''}`}>
      <button
        className="row-action-button"
        type="button"
        disabled={mutation.isPending}
        onClick={(event) => {
          event.stopPropagation();
          mutation.mutate('resolved');
        }}
      >
        Resolver
      </button>
      <button
        className="row-action-button"
        type="button"
        disabled={mutation.isPending}
        onClick={(event) => {
          event.stopPropagation();
          mutation.mutate('archived');
        }}
      >
        Arquivar
      </button>
    </div>
  );
}
