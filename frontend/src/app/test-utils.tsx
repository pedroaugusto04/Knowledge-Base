import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';

import { NotificationsProvider } from '../shared/ui/notifications';

const testQueryClients = new Set<QueryClient>();

afterEach(() => {
  for (const client of testQueryClients) {
    client.clear();
  }
  testQueryClients.clear();
});

export function renderWithAppProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  testQueryClients.add(client);

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      <NotificationsProvider />
    </QueryClientProvider>,
  );
}
