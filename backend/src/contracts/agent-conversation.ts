import { z } from 'zod';

import { CanonicalType, ConversationConfidence, Importance, KnowledgeKind } from './enums.js';

const agentApprovalSchema = z.enum(['none', 'folder_create', 'final_confirmation']);
const agentActionSchema = z.enum(['ask', 'confirm', 'create_and_confirm', 'cancel', 'submit']);

export const agentConversationDraftSchema = z.object({
  rawText: z.string().default(''),
  title: z.string().default(''),
  kind: z.nativeEnum(KnowledgeKind).default(KnowledgeKind.Note),
  canonicalType: z.nativeEnum(CanonicalType).default(CanonicalType.Event),
  importance: z.nativeEnum(Importance).default(Importance.Low),
  tags: z.array(z.string()).default([]),
  reminderDate: z.string().default(''),
  reminderTime: z.string().default(''),
});

export const agentConversationProjectDecisionSchema = z.object({
  selectedProjectSlug: z.string().default(''),
});

export const agentConversationFolderDecisionSchema = z.object({
  selectedFolderId: z.string().default(''),
  suggestedFolderPath: z.array(z.string()).default([]),
  placeInRoot: z.boolean().default(false),
  folderApproved: z.boolean().default(false),
});

export const agentConversationStateSchema = z.object({
  draft: agentConversationDraftSchema.default({}),
  project: agentConversationProjectDecisionSchema.default({}),
  folder: agentConversationFolderDecisionSchema.default({}),
  pendingApproval: agentApprovalSchema.default('none'),
  lastQuestion: z.string().default(''),
  lastUserMessage: z.string().default(''),
  lastAgentAction: agentActionSchema.default('ask'),
  confidence: z.nativeEnum(ConversationConfidence).default(ConversationConfidence.Low),
  updatedAt: z.string().default(''),
});

export const conversationAgentDecisionSchema = z.object({
  replyText: z.string().default(''),
  resolvedDraft: agentConversationDraftSchema.default({}),
  selectedProjectSlug: z.string().default(''),
  selectedFolderId: z.string().default(''),
  suggestedFolderPath: z.array(z.string()).default([]),
  pendingApproval: agentApprovalSchema.default('none'),
  confidence: z.nativeEnum(ConversationConfidence).default(ConversationConfidence.Low),
  action: agentActionSchema.default('ask'),
});

export type AgentConversationApproval = z.infer<typeof agentApprovalSchema>;
export type AgentConversationAction = z.infer<typeof agentActionSchema>;
export type AgentConversationDraft = z.infer<typeof agentConversationDraftSchema>;
export type AgentConversationState = z.infer<typeof agentConversationStateSchema>;
export type ConversationAgentDecision = z.infer<typeof conversationAgentDecisionSchema>;
