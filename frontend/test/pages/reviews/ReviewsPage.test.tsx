import '@testing-library/jest-dom/vitest';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { renderWithAppProviders } from '../../../src/app/test-utils';
import { ReviewsPage } from '../../../src/pages/reviews/ReviewsPage';
import type { Dashboard } from '../../../src/shared/api/models/dashboard';

const dashboard: Dashboard = {
  workspaces: [{ workspaceSlug: 'default', displayName: 'Default' }],
  projects: [
    {
      projectSlug: 'knowledge-base',
      displayName: 'Knowledge Base',
      repositories: [],
      workspaceSlug: 'default',
      aliases: [],
      defaultTags: [],
      enabled: true,
    },
  ],
  notes: [],
  reviews: [
    {
      id: 'review-1',
      title: 'Review critico',
      repo: 'pedroaugusto04/knowledge-base',
      project: 'knowledge-base',
      branch: 'main',
      date: '2026-05-08',
      status: 'open',
      summary: 'Resumo gerado pela IA.',
      impact: 'Medio',
      changedFiles: ['backend/src/domain/notes.ts'],
      generatedNotePath: '20 Inbox/knowledge-base/2026/05/20260508-005308-review-pedroaugusto04knowledge-base-e35e1e8f.md',
      findings: [
        {
          severity: 'medium',
          file: 'backend/src/domain/notes.ts',
          line: 12,
          summary: 'Ajustar renderizacao.',
          recommendation: 'Remover duplicidade visual.',
          status: 'open',
        },
      ],
    },
  ],
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

afterEach(() => {
  cleanup();
});

function renderReviewsPage() {
  return renderWithAppProviders(
    <Routes>
      <Route
        path="/reviews/:reviewId"
        element={
          <ReviewsPage
            dashboard={dashboard}
            selectedProject="knowledge-base"
            selectedNoteId=""
            selectedReviewId=""
            setSelectedProject={vi.fn()}
            openNote={vi.fn()}
            openReview={vi.fn()}
          />
        }
      />
    </Routes>,
    { route: '/reviews/review-1' },
  );
}

describe('ReviewsPage', () => {
  it('does not show the generated note path in the review detail panel', () => {
    const { container } = renderReviewsPage();

    expect(screen.getByRole('heading', { name: 'AI Review Detail' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nota gerada' })).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(
      '20 Inbox/knowledge-base/2026/05/20260508-005308-review-pedroaugusto04knowledge-base-e35e1e8f.md',
    );
  });
});
