import { keepPreviousData, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import type { PageContext } from '../../app/page-context';
import { formatDisplayToken } from '../../entities/format';
import { fetchAskHistory, fetchNotes, runAsk, runQuery } from '../../shared/api/client';
import type { AskHistoryResponse } from '../../shared/api/models/ask';
import type { AskAnswerCardItem } from '../../widgets/ask/AskAnswerCard';
import { AskAnswerCard, projectLabel } from '../../widgets/ask/AskAnswerCard';
import { AskAiIcon } from '../../widgets/ask/AskAiIcon';
import type { NoteSummary } from '../../shared/api/models/note';
import { type NoteStatus } from '../../shared/api/models/note-status';
import { DEFAULT_PAGE_SIZE } from '../../shared/api/models/pagination';
import { EmptyState, InlineMessage, PageHead, Panel } from '../../shared/ui/primitives';
import { Pagination } from '../../shared/ui/pagination';
import { Select } from '../../shared/ui/select';
import { useDebouncedValue } from '../../shared/ui/use-debounced-value';
import { usePaginationState } from '../../shared/ui/use-pagination-state';
import { NoteRow } from '../../widgets/notes/NoteRow';
import './SearchPage.css';

const SEARCH_DEBOUNCE_MS = 350;

const statusOptions: Array<{ value: '' | NoteStatus; label: string }> = [
  { value: '', label: 'All' },
  ...(['active', 'pending', 'sent', 'resolved', 'archived'] as NoteStatus[]).map((value) => ({
    value,
    label: formatDisplayToken(value),
  })),
];

const askSuggestions = [
  'What are the main decisions recently?',
  'Summarize the deployment rollout status.',
];

export function SearchPage({ dashboard, openNote, editNote, deleteNote }: PageContext) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [projectSlug, setProjectSlug] = useState('');
  const [status, setStatus] = useState<'' | NoteStatus>('');
  const [askAnswer, setAskAnswer] = useState<AskAnswerCardItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const workspaceSlug = dashboard.workspaces[0]?.workspaceSlug || '';
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const debouncedProjectSlug = useDebouncedValue(projectSlug, SEARCH_DEBOUNCE_MS);
  const debouncedStatus = useDebouncedValue(status, SEARCH_DEBOUNCE_MS);
  const hasQuery = Boolean(debouncedQuery.trim());
  const hasQueryInput = Boolean(query.trim());
  const { page, setPage } = usePaginationState(`${debouncedQuery}:${debouncedProjectSlug}:${workspaceSlug}:${debouncedStatus}`);
  const { page: historyPage, setPage: setHistoryPage } = usePaginationState(`ask-history:${projectSlug}`);

  const setQuery = (newQuery: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newQuery) {
        next.set('q', newQuery);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  };

  const queryResult = useQuery({
    queryKey: ['search', debouncedQuery, debouncedProjectSlug, workspaceSlug, debouncedStatus, page],
    queryFn: () => runQuery({
      query: debouncedQuery,
      projectSlug: debouncedProjectSlug,
      workspaceSlug,
      status: debouncedStatus,
      limit: 10,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
  });
  const notesResult = useQuery({
    queryKey: ['search-notes', debouncedProjectSlug, workspaceSlug, debouncedStatus, page],
    queryFn: () => fetchNotes({ page, workspaceSlug, projectSlug: debouncedProjectSlug, status: debouncedStatus }),
    enabled: !hasQuery,
    placeholderData: keepPreviousData,
    initialData: !hasQuery && dashboard.notes
      ? dashboardNotesPage(dashboard.notes, {
        workspaceSlug,
        projectSlug: debouncedProjectSlug,
        status: debouncedStatus,
      })
      : undefined,
  });
  const historyQuery = useQuery({
    queryKey: ['ask-history', projectSlug, historyPage],
    queryFn: () => fetchAskHistory({ projectSlug, page: historyPage, pageSize: DEFAULT_PAGE_SIZE }),
    enabled: showHistory,
    placeholderData: keepPreviousData,
  });

  const selectedProjectLabel = projectLabel(projectSlug, dashboard.projects);
  const visibleNotes = hasQuery
    ? queryResult.data?.matches.map(queryMatchToNoteSummary) || []
    : notesResult.data?.notes || [];
  const pagination = hasQuery ? queryResult.data?.pagination : notesResult.data?.pagination;
  const isResultsStale = hasQuery ? queryResult.isPlaceholderData : notesResult.isPlaceholderData;
  const isResultsError = hasQuery ? queryResult.isError : notesResult.isError;

  const handleAsk = async () => {
    const question = query.trim();
    if (!question || isAsking) return;

    setIsAsking(true);
    setAskError(null);
    setAskAnswer(null);
    setShowHistory(false);

    try {
      const result = await runAsk({ question, projectSlug });
      if (result?.ok) {
        setAskAnswer({
          question,
          answer: result.answer,
          projectSlug,
          sources: result.sources || [],
        });
        setHistoryPage(1);
        await queryClient.invalidateQueries({ queryKey: ['ask-history'] });
      } else {
        setAskError('Could not generate an answer. Please try again.');
      }
    } catch (error: unknown) {
      setAskError(error instanceof Error ? error.message : 'An unexpected error occurred while communicating with the AI.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <>
      <PageHead title="Search" subtitle="Search notes and ask AI from the same evidence." />

      <section className="search-box unified-search-box">
        <input
          aria-label="Search query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or ask anything..."
          type="search"
        />
        <div className="filters">
          <Select
            ariaLabel="Current workspace"
            className="search-filter search-filter-workspace"
            disabled
            options={[{ value: workspaceSlug || 'current-workspace', label: workspaceSlug || 'current-workspace' }]}
            value={workspaceSlug || 'current-workspace'}
            onChange={() => undefined}
          />
          <Select
            ariaLabel="Filter by project"
            className="search-filter search-filter-project"
            options={[
              { value: '', label: 'All projects' },
              ...dashboard.projects.map((project) => ({
                value: project.projectSlug,
                label: project.displayName,
              })),
            ]}
            value={projectSlug}
            onChange={(nextProjectSlug) => {
              setProjectSlug(nextProjectSlug);
              setAskAnswer(null);
              setAskError(null);
            }}
          />
          <Select
            ariaLabel="Filter by status"
            className="search-filter search-filter-status"
            options={statusOptions}
            value={status}
            onChange={(nextValue) => setStatus(nextValue as '' | NoteStatus)}
          />
        </div>
      </section>

      <Panel className="ai-answer-panel">
        <div className="ai-answer-heading">
          <div>
            <h2>AI Answer</h2>
            <p>Uses the current query and selected project.</p>
          </div>
          <div className="ai-answer-actions">
            <button className="icon-button secondary" type="button" onClick={() => setShowHistory((current) => !current)}>
              {showHistory ? 'Answer' : 'History'}
            </button>
            <button className="icon-button" disabled={!hasQueryInput || isAsking} type="button" onClick={handleAsk}>
              <AskAiIcon className="ai-answer-action-icon" />
              {isAsking ? 'Asking...' : 'Ask AI about this'}
            </button>
          </div>
        </div>

        {!showHistory && !askAnswer && !isAsking && !askError ? (
          <div className="ask-inline-empty">
            <div className="ask-suggestions">
              <span className="suggestion-title">Try asking:</span>
              {askSuggestions.map((suggestion) => (
                <button className="suggestion-btn" key={suggestion} type="button" onClick={() => setQuery(suggestion)}>
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!showHistory && isAsking ? <AskAnswerSkeleton question={query.trim()} projectLabel={selectedProjectLabel} /> : null}

        {!showHistory && askAnswer ? (
          <AskAnswerCard item={askAnswer} openNote={openNote} projects={dashboard.projects} />
        ) : null}

        {!showHistory && askError ? <InlineMessage tone="error">{askError}</InlineMessage> : null}

        {showHistory ? (
          <AskHistorySection
            historyQuery={historyQuery}
            openNote={openNote}
            projects={dashboard.projects}
            setPage={setHistoryPage}
          />
        ) : null}
      </Panel>

      <Panel className="matching-notes-panel">
        <div className="matching-notes-heading">
          <h2>Matching Notes</h2>
          <span className="matching-notes-count">{pagination ? `${pagination.total} total` : ''}</span>
        </div>
        {isResultsError ? <InlineMessage tone="error">Could not load notes for these filters.</InlineMessage> : null}
        <div className={`list ${isResultsStale ? 'stale-data' : ''}`}>
          {visibleNotes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              dashboard={dashboard}
              onDelete={() => deleteNote({ id: note.id, title: note.title })}
              onEdit={() => editNote(note.id)}
              onOpen={openNote}
            />
          ))}
        </div>
        {pagination ? <Pagination pagination={pagination} onPageChange={setPage} /> : null}
        {!visibleNotes.length && !isResultsError ? <EmptyState>No notes found with these filters.</EmptyState> : null}
      </Panel>
    </>
  );
}

function AskAnswerSkeleton({ question, projectLabel: selectedProjectLabel }: { question: string; projectLabel: string }) {
  return (
    <div className="ask-qa-card skeleton-card">
      <div className="ask-question-bubble">
        <span className="question-text">{question}</span>
        <span className="ask-project-chip">{selectedProjectLabel}</span>
      </div>
      <div className="ask-answer-container">
        <div className="ask-answer-header">
          <div className="ask-ai-identity">
            <AskAiIcon className="ask-ai-identity-icon" />
            <strong>Thinking...</strong>
          </div>
        </div>
        <div className="ask-skeleton-lines">
          <div className="skeleton-line line-1"></div>
          <div className="skeleton-line line-2"></div>
          <div className="skeleton-line line-3"></div>
        </div>
      </div>
    </div>
  );
}

function AskHistorySection({
  historyQuery,
  openNote,
  projects,
  setPage,
}: {
  historyQuery: UseQueryResult<AskHistoryResponse>;
  openNote: (id: string) => void;
  projects: PageContext['dashboard']['projects'];
  setPage: (page: number) => void;
}) {
  const history = historyQuery.data?.history || [];

  if (historyQuery.isLoading) {
    return <div className="inline-message">Loading history...</div>;
  }

  if (historyQuery.isError) {
    return <InlineMessage tone="error">Could not load Ask AI history.</InlineMessage>;
  }

  if (history.length === 0) {
    return <div className="inline-message">No Ask AI history for this filter.</div>;
  }

  return (
    <div className={`ask-history-list ${historyQuery.isPlaceholderData ? 'stale-data' : ''}`}>
      {history.map((item) => (
        <AskAnswerCard key={item.id} item={item} openNote={openNote} projects={projects} />
      ))}
      {historyQuery.data?.pagination ? (
        <Pagination compact pagination={historyQuery.data.pagination} onPageChange={setPage} />
      ) : null}
    </div>
  );
}

function queryMatchToNoteSummary(match: {
  id: string;
  path: string;
  title: string;
  type: string;
  project: string;
  workspace: string;
  tags: string[];
  date: string;
  status: NoteStatus;
  summary: string;
  source: string;
}): NoteSummary {
  return {
    ...match,
    attachmentCount: 0,
    folderId: null,
  };
}

function dashboardNotesPage(
  notes: NoteSummary[],
  filters: { workspaceSlug: string; projectSlug: string; status: '' | NoteStatus },
) {
  const filteredNotes = notes.filter((note) =>
    (!filters.workspaceSlug || note.workspace === filters.workspaceSlug)
    && (!filters.projectSlug || note.project === filters.projectSlug)
    && (!filters.status || note.status === filters.status),
  );

  return {
    ok: true as const,
    notes: filteredNotes.slice(0, DEFAULT_PAGE_SIZE),
    pagination: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: filteredNotes.length,
      totalPages: Math.max(1, Math.ceil(filteredNotes.length / DEFAULT_PAGE_SIZE)),
      hasNext: filteredNotes.length > DEFAULT_PAGE_SIZE,
      hasPrevious: false,
    },
  };
}
