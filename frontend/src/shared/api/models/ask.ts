import type { PaginationMeta } from './pagination';

export type AskResponse = {
  ok: boolean;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    noteId: string;
    title: string;
    path: string;
  }>;
  relatedNotes: Array<{
    id: string;
    title: string;
    path: string;
    projectSlug?: string;
    workspaceSlug?: string;
  }>;
};

export type AskHistoryItem = {
  id: string;
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  projectSlug: string;
  sources: Array<{
    noteId: string;
    title: string;
    path: string;
  }>;
  relatedNotes: Array<{
    id: string;
    title: string;
    path: string;
    projectSlug?: string;
    workspaceSlug?: string;
  }>;
  createdAt: string;
};

export type AskHistoryResponse = {
  ok: true;
  history: AskHistoryItem[];
  pagination: PaginationMeta;
};
