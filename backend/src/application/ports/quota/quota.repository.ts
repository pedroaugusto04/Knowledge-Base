import type {
  PlanRecord,
  UserSubscriptionWithPlan,
  QuotaAdjustmentRecord,
  SaveQuotaUsageEventInput,
} from '../../models/repository-records.models.js';

export abstract class QuotaRepository {
  abstract getSubscription(userId: string): Promise<UserSubscriptionWithPlan | null>;
  abstract getPlanBySlug(slug: string): Promise<PlanRecord | null>;
  abstract getActiveAdjustments(userId: string, type: string): Promise<QuotaAdjustmentRecord[]>;
  abstract getCurrentUsage(userId: string, type: string, start: Date, end: Date): Promise<number>;
  abstract saveUsageEvent(input: SaveQuotaUsageEventInput): Promise<void>;
  abstract getAttachmentStorageUsage(userId: string): Promise<number>;
  abstract getWorkspaceCount(userId: string): Promise<number>;
  abstract getProjectCountInWorkspace(userId: string, workspaceId: string): Promise<number>;
}
