import type { Dashboard } from '../../shared/api/models/dashboard';
import type { NoteSummary } from '../../shared/api/models/note';
import type { ProjectTimelineCategory, ProjectTimelineItem } from '../../shared/api/models/project-timeline';
import type { PaginationMeta } from '../../shared/api/models/pagination';
import { formatUsDateTime, noteTypeLabel, projectName } from '../../entities/format';
import { Badge, EmptyState } from '../../shared/ui/primitives';
import { Pagination } from '../../shared/ui/pagination';

const categoryOptions: Array<{ value: ProjectTimelineCategory; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'github-push', label: 'GitHub' },
  { value: 'manual', label: 'Manual' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'decision', label: 'Decision' },
];

const categoryLabels: Record<ProjectTimelineItem['category'], string> = {
  whatsapp: 'WhatsApp',
  'github-push': 'GitHub',
  manual: 'Manual',
  reminder: 'Reminder',
  decision: 'Decision',
};

export function ProjectTimeline({
  dashboard,
  items,
  pagination,
  category,
  onCategoryChange,
  onOpenNote,
  onEditNote,
  onDeleteNote,
  onPageChange,
}: {
  dashboard: Dashboard;
  items: ProjectTimelineItem[];
  pagination?: PaginationMeta;
  category: ProjectTimelineCategory;
  onCategoryChange: (category: ProjectTimelineCategory) => void;
  onOpenNote: (noteId: string) => void;
  onEditNote?: (note: NoteSummary) => void;
  onDeleteNote?: (note: NoteSummary) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="project-timeline">
      <div className="timeline-filter-row" role="group" aria-label="Timeline category">
        {categoryOptions.map((option) => (
          <button
            aria-pressed={category === option.value}
            className={category === option.value ? 'active' : ''}
            key={option.value}
            type="button"
            onClick={() => onCategoryChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {items.length > 0 ? (
        <div className="project-timeline-list">
          {items.map((item) => (
            <article className="project-timeline-item" key={item.id}>
              <div className="project-timeline-marker" aria-hidden="true" />
              <div className="project-timeline-card">
                <div className="project-timeline-meta">
                  <Badge value={categoryLabels[item.category]} tone={item.category} />
                  <Badge value={noteTypeLabel(item.type)} tone={item.type} />
                  <Badge value={item.status} tone={item.status} />
                  <span className="meta">{formatUsDateTime(item.date)}</span>
                  <span className="meta">{projectName(dashboard.projects, item.project)}</span>
                  <span className="meta">{item.source || item.sourceChannel}</span>
                </div>
                <div className="project-timeline-body">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <div className="row-actions">
                    {onEditNote ? (
                      <button
                        aria-label={`Edit note ${item.title}`}
                        className="row-action-button"
                        title="Edit"
                        type="button"
                        onClick={() => onEditNote(item)}
                      >
                        E
                      </button>
                    ) : null}
                    {onDeleteNote ? (
                      <button
                        aria-label={`Delete note ${item.title}`}
                        className="row-action-button danger"
                        title="Delete"
                        type="button"
                        onClick={() => onDeleteNote(item)}
                      >
                        D
                      </button>
                    ) : null}
                    <button className="icon-button" type="button" onClick={() => onOpenNote(item.noteId)}>
                      Open note
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>No timeline items for this category.</EmptyState>
      )}
      {pagination ? <Pagination pagination={pagination} onPageChange={onPageChange} /> : null}
    </div>
  );
}
