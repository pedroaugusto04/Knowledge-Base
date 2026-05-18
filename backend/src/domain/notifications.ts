import type { IngestPayload } from '../contracts/ingest.js';

export function buildTelegramCodeReviewMessage(payload: IngestPayload): string {
  const sections = payload.content.sections;
  const findings = sections.reviewFindings || [];
  const lines = [
    'AI code review saved in the Knowledge Base',
    `Project: ${payload.event.projectSlug}`,
    `Summary: ${sections.summary || payload.content.rawText}`,
    sections.impact ? `Impact: ${sections.impact}` : '',
    findings.length ? 'Findings:' : '',
    ...findings.slice(0, 5).map((finding) => `- [${finding.severity.toUpperCase()}] ${finding.summary}${finding.file ? ` (${finding.file})` : ''}`),
    sections.nextSteps?.length ? `Next steps: ${sections.nextSteps.join(' | ')}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}
