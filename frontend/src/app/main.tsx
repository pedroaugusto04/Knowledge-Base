import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { frontendBasePath } from './base-path';
import { GlobalLoadingProvider } from './global-loading';
import { queryClient } from './providers/query-client';
import { ThemeProvider } from './providers/theme';
import { AppShell } from '../layouts/AppShell';
import '../shared/styles/global.css';
import { NotificationsProvider } from '../shared/ui/notifications';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GlobalLoadingProvider>
          <BrowserRouter basename={frontendBasePath}>
            <AppShell />
          </BrowserRouter>
        </GlobalLoadingProvider>
        <NotificationsProvider />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
