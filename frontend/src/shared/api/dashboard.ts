import type { Dashboard, DashboardPayload } from './models/dashboard';
import { request } from './request';

export function fetchDashboard(): Promise<Dashboard> {
  return request<DashboardPayload>('/api/dashboard');
}
