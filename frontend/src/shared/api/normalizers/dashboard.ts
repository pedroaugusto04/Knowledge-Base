import type { Dashboard, DashboardPayload } from '../models/dashboard';
import { buildDashboardHome } from './dashboard-home';

export function normalizeDashboard(payload: DashboardPayload): Dashboard {
  return {
    workspaces: payload.workspaces || [],
    projects: payload.projects || [],
    notes: payload.notes || [],
    reviews: payload.reviews || [],
    reminders: payload.reminders || [],
    home: buildDashboardHome(payload.projects || [], payload.notes || [], payload.reviews || [], payload.reminders || []),
  };
}
