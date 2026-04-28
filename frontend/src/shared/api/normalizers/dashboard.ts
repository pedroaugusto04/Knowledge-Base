import type { Dashboard, DashboardPayload } from '../models/dashboard';

export function normalizeDashboard(payload: DashboardPayload): Dashboard {
  return {
    workspaces: payload.workspaces || [],
    projects: payload.projects || [],
    notes: payload.notes || [],
    reviews: payload.reviews || [],
    reminders: payload.reminders || [],
    home: payload.home,
  };
}
