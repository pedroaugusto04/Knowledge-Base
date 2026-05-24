import { Importance, KnowledgeKind } from '../contracts/enums.js';
import type { IngestPayload } from '../contracts/ingest.js';

export function defaultImportance(kind: IngestPayload['classification']['kind']): IngestPayload['classification']['importance'] {
  if (kind === KnowledgeKind.Bug) return Importance.High;
  if (kind === KnowledgeKind.Summary || kind === KnowledgeKind.Article || kind === KnowledgeKind.Daily) return Importance.Medium;
  return Importance.Low;
}
