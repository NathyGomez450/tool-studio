import { fake } from './client';
import { dashboard, type DashboardData } from '@/lib/data';

export function fetchDashboard(): Promise<DashboardData> {
  return fake(dashboard);
}
