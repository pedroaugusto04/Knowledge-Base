import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import type { PageContext } from '../../app/page-context';
import { fetchNotes, runQuery } from '../../shared/api/client';
import { DEFAULT_PAGE_SIZE } from '../../shared/api/models/pagination';
import { type NoteStatus } from '../../shared/api/models/note-status';
import { EmptyState, PageHead, Panel } from '../../shared/ui/primitives';
import { Pagination } from '../../shared/ui/pagination';
import { Select } from '../../shared/ui/select';
import { usePaginationState } from '../../shared/ui/use-pagination-state';
import { NoteRow } from '../../widgets/notes/NoteRow';

const statusOptions: Array<{ value: '' | NoteStatus; label: string }> = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

export function SearchPage({ dashboard, openNote, editNote, deleteNote }: PageContext) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const setQuery = (newQuery: string) => {
    setSearchParams((prev) => {
      if (newQuery) {
        prev.set('q', newQuery);
      } else {
        prev.delete('q');
      }
      return prev;
    }, { replace: true });
  };
  const [projectSlug, setProjectSlug] = useState('');
  const [status, setStatus] = useState<'' | NoteStatus>('');
  const workspaceSlug = dashboard.workspaces[0]?.workspaceSlug || '';
  const { page, setPage } = usePaginationState(`${query}:${projectSlug}:${workspaceSlug}:${status}`);
  const hasQuery = Boolean(query.trim());
  const queryResult = useQuery({
    queryKey: ['search', query, projectSlug, workspaceSlug, status, page],
    queryFn: () => runQuery({ query, projectSlug, workspaceSlug, status, limit: 10, page, pageSize: DEFAULT_PAGE_SIZE }),
    enabled: hasQuery,
  });
  const notesResult = useQuery({
    queryKey: ['search-notes', projectSlug, workspaceSlug, status, page],
    queryFn: () => fetchNotes({ page, workspaceSlug, projectSlug, status }),
    enabled: !hasQuery,
    initialData: !hasQuery && dashboard.notes
      ? {
          ok: true as const,
          notes: dashboard.notes
            .filter((note) =>
              (!workspaceSlug || note.workspace === workspaceSlug)
              && (!projectSlug || note.project === projectSlug)
              && (!status || note.status === status),
            )
            .slice(0, DEFAULT_PAGE_SIZE),
          pagination: {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            total: dashboard.notes.filter((note) =>
              (!workspaceSlug || note.workspace === workspaceSlug)
              && (!projectSlug || note.project === projectSlug)
              && (!status || note.status === status),
            ).length,
            totalPages: Math.max(1, Math.ceil(dashboard.notes.filter((note) =>
              (!workspaceSlug || note.workspace === workspaceSlug)
              && (!projectSlug || note.project === projectSlug)
              && (!status || note.status === status),
            ).length / DEFAULT_PAGE_SIZE)),
            hasNext: dashboard.notes.filter((note) =>
              (!workspaceSlug || note.workspace === workspaceSlug)
              && (!projectSlug || note.project === projectSlug)
              && (!status || note.status === status),
            ).length > DEFAULT_PAGE_SIZE,
            hasPrevious: false,
          },
        }
      : undefined,
  });

  return (
    <>
      <PageHead title="Search" subtitle="" />
      <section className="search-box">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter what you are looking for..." type="search" />
        <div className="filters">
          <Select
            ariaLabel="Current workspace"
            disabled
            options={[{ value: workspaceSlug || 'current-workspace', label: workspaceSlug || 'current-workspace' }]}
            value={workspaceSlug || 'current-workspace'}
            onChange={() => undefined}
          />
          <Select
            ariaLabel="Filter by project"
            options={[
              { value: '', label: 'All projects' },
              ...dashboard.projects.map((project) => ({
                value: project.projectSlug,
                label: project.displayName,
              })),
            ]}
            value={projectSlug}
            onChange={setProjectSlug}
          />
          <Select
            ariaLabel="Filter by status"
            options={statusOptions}
            value={status}
            onChange={(nextValue) => setStatus(nextValue as '' | NoteStatus)}
          />
          <button className="icon-button" type="button" onClick={() => void (hasQuery ? queryResult.refetch() : notesResult.refetch())}>
            Search
          </button>
        </div>
      </section>
      <Panel>
        <h2>Results</h2>
        <div className="list">
          {hasQuery
            ? queryResult.data?.matches.map((match) => (
              <NoteRow
                key={match.id}
                note={{ ...match, folderId: null }}
                dashboard={dashboard}
                onDelete={() => deleteNote({ id: match.id, title: match.title })}
                onEdit={() => editNote(match.id)}
                onOpen={openNote}
              />
            ))
            : notesResult.data?.notes.map((note) => (
              <NoteRow key={note.id} note={note} dashboard={dashboard} onDelete={() => deleteNote(note)} onEdit={() => editNote(note.id)} onOpen={openNote} />
            ))}
        </div>
        {hasQuery && queryResult.data ? <Pagination pagination={queryResult.data.pagination} onPageChange={setPage} /> : null}
        {!hasQuery && notesResult.data ? <Pagination pagination={notesResult.data.pagination} onPageChange={setPage} /> : null}
        {hasQuery && !queryResult.data?.matches.length ? <EmptyState>Try another term or remove some filters.</EmptyState> : null}
        {!hasQuery && !notesResult.data?.notes.length ? <EmptyState>No notes found with these filters.</EmptyState> : null}
      </Panel>
    </>
  );
}
