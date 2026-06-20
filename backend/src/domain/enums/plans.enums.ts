export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum QuotaResourceType {
  STORAGE = 'storage',
  AI_REQUEST = 'ai_request',
  WORKSPACE = 'workspace',
  PROJECT = 'project',
}

export interface PlanLimits {
  maxStorageBytes: number;
  maxAiRequestsPerMonth: number;
  maxWorkspaces: number;
  maxProjectsPerWorkspace: number;
}
