import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithAppProviders } from '../../../src/app/test-utils';
import { ProjectKnowledgeMapPage } from '../../../src/features/projects/knowledge-map/ProjectKnowledgeMapPage';
import type { Dashboard } from '../../../src/shared/api/models/dashboard';
import type { ProjectKnowledgeMapResponse } from '../../../src/shared/api/models/project-knowledge-map';

const dashboard: Dashboard = {
  workspaces: [{ workspaceSlug: 'default', displayName: 'Default' }],
  projects: [
    {
      projectSlug: 'platform',
      displayName: 'Platform',
      repositories: [],
      workspaceSlug: 'default',
      defaultTags: [],
      enabled: true,
    },
  ],
  notes: [],
  reminders: [],
  home: {
    windowDays: 7,
    metrics: [],
    activityByDay: [],
    activityByProject: [],
    priorities: [],
    recentInterestingEvents: [],
  },
};

function graphResponse(overrides: Partial<ProjectKnowledgeMapResponse> = {}): ProjectKnowledgeMapResponse {
  return {
    ok: true,
    projectSlug: 'platform',
    nodes: [
      { id: 'project:platform', type: 'project', label: 'Platform', projectSlug: 'platform' },
      { id: 'note:note-1', type: 'note', label: 'Deploy', noteId: 'note-1', projectSlug: 'platform', category: 'manual' },
      { id: 'tag:deploy', type: 'tag', label: 'deploy', projectSlug: 'platform' },
    ],
    links: [
      { id: 'contains:project:platform->note:note-1', source: 'project:platform', target: 'note:note-1', type: 'contains' },
      { id: 'tagged-with:note:note-1->tag:deploy', source: 'note:note-1', target: 'tag:deploy', type: 'tagged-with' },
    ],
    stats: {
      noteCount: 1,
      tagCount: 1,
      folderCount: 0,
      repositoryCount: 0,
    },
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderMap(openNote = vi.fn()) {
  renderWithAppProviders(
    <Routes>
      <Route path="/projects/:projectSlug/map" element={<ProjectKnowledgeMapPage dashboard={dashboard} openNote={openNote} />} />
    </Routes>,
    { route: '/projects/platform/map' },
  );
  return { openNote };
}

describe('ProjectKnowledgeMapPage', () => {
  it('loads the project knowledge map and renders graph controls and legend', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/projects/platform/knowledge-map?limit=80&category=all') {
        return Response.json(graphResponse());
      }
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderMap();

    expect(await screen.findByRole('img', { name: 'Project knowledge map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument();
    expect(screen.getByLabelText('Knowledge map stats')).toHaveTextContent('1 notes');
    expect(screen.getByLabelText('Knowledge map legend')).toHaveTextContent('Project');
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/platform/knowledge-map?limit=80&category=all', expect.anything());
  });

  it('opens note nodes from the map', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(graphResponse())));
    const { openNote } = renderMap();

    fireEvent.click(await screen.findByRole('button', { name: 'Open note Deploy' }));

    expect(openNote).toHaveBeenCalledWith('note-1');
  });

  it('shows an empty state when the project has no notes to map', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(graphResponse({
      nodes: [{ id: 'project:platform', type: 'project', label: 'Platform', projectSlug: 'platform' }],
      links: [],
      stats: { noteCount: 0, tagCount: 0, folderCount: 0, repositoryCount: 0 },
    }))));

    renderMap();

    expect(await screen.findByText('No recent project notes to map yet.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('img', { name: 'Project knowledge map' })).not.toBeInTheDocument());
  });
});
