import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ProjectsPageContext } from '../../../app/page-context';
import { routes } from '../../../app/routing/routes';
import { fetchProjectKnowledgeMap } from '../../../shared/api/client';
import type { KnowledgeMapNodeType, ProjectKnowledgeMapResponse } from '../../../shared/api/models/project-knowledge-map';
import { EmptyState, InlineMessage, PageHead } from '../../../shared/ui/primitives';
import { ProjectKnowledgeForceGraph } from './ProjectKnowledgeForceGraph';
import { knowledgeMapNodeStyles } from './knowledge-map.constants';

type ProjectKnowledgeMapPageProps = Pick<ProjectsPageContext, 'dashboard' | 'openNote'>;

export function ProjectKnowledgeMapPage({ dashboard, openNote }: ProjectKnowledgeMapPageProps) {
  const params = useParams();
  const navigate = useNavigate();
  const projectSlug = params.projectSlug ? decodeURIComponent(params.projectSlug) : '';
  const project = useMemo(
    () => dashboard.projects.find((item) => item.projectSlug === projectSlug) || null,
    [dashboard.projects, projectSlug],
  );
  const [paused, setPaused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const query = useQuery({
    queryKey: ['project-knowledge-map', projectSlug],
    queryFn: () => fetchProjectKnowledgeMap(projectSlug),
    enabled: Boolean(projectSlug),
    staleTime: 30_000,
  });
  const graph = query.data;

  if (!project) {
    return (
      <>
        <PageHead title="Knowledge map" subtitle="Project not found." onBack={() => navigate(routes.projects)} />
        <EmptyState>Project not found.</EmptyState>
      </>
    );
  }

  return (
    <div className="knowledge-map-page">
      <PageHead
        title={(
          <div className="page-head-title-row">
            <h1>{project.displayName}</h1>
            <span className="repo-tag">Map</span>
          </div>
        )}
        subtitle="Recent notes, folders, repositories, tags, and categories."
        action={(
          <div className="knowledge-map-actions">
            <button className="icon-button secondary" type="button" onClick={() => setPaused((current) => !current)}>
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button className="icon-button" type="button" onClick={() => setResetSignal((current) => current + 1)}>
              Reset view
            </button>
          </div>
        )}
        backLabel="Back to project"
        onBack={() => navigate(routes.project(project.projectSlug))}
      />

      {query.isError ? (
        <InlineMessage tone="error">Could not load the project knowledge map.</InlineMessage>
      ) : null}

      {query.isLoading ? (
        <div className="knowledge-map-loading" role="status">Loading map...</div>
      ) : graph && graph.stats.noteCount === 0 ? (
        <EmptyState>No recent project notes to map yet.</EmptyState>
      ) : graph ? (
        <>
          <KnowledgeMapStats stats={graph.stats} />
          <KnowledgeMapLegend presentTypes={new Set(graph.nodes.map((node) => node.type))} />
          <ProjectKnowledgeForceGraph
            links={graph.links}
            nodes={graph.nodes}
            onOpenNote={openNote}
            paused={paused}
            resetSignal={resetSignal}
          />
        </>
      ) : null}
    </div>
  );
}

function KnowledgeMapStats({ stats }: { stats: ProjectKnowledgeMapResponse['stats'] }) {
  return (
    <div className="knowledge-map-stats" aria-label="Knowledge map stats">
      <span>{stats.noteCount} notes</span>
      <span>{stats.folderCount} folders</span>
      <span>{stats.repositoryCount} repositories</span>
      <span>{stats.tagCount} tags</span>
    </div>
  );
}

function KnowledgeMapLegend({ presentTypes }: { presentTypes: Set<KnowledgeMapNodeType> }) {
  const types = Object.keys(knowledgeMapNodeStyles) as KnowledgeMapNodeType[];
  return (
    <div className="knowledge-map-legend" aria-label="Knowledge map legend">
      {types.filter((type) => presentTypes.has(type)).map((type) => (
        <span key={type}>
          <i style={{ background: knowledgeMapNodeStyles[type].color }} />
          {knowledgeMapNodeStyles[type].label}
        </span>
      ))}
    </div>
  );
}
