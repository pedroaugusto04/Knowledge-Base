import type { IngestPayload } from '../contracts/ingest.js';

function commitLabel(payload: IngestPayload): string {
  const sha = String(payload.metadata.headSha || '').trim();
  return sha ? sha.slice(0, 12) : 'unknown';
}

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

export function buildWhatsappHighSeverityCodeReviewMessage(payload: IngestPayload): string {
  const sections = payload.content.sections;
  const findings = (sections.reviewFindings || []).filter((finding) => ['high', 'critical'].includes(finding.severity));
  const lines = [
    'Alerta de code review da IA',
    `Projeto: ${payload.event.projectSlug}`,
    `Repositório: ${String(payload.metadata.repoFullName || '').trim() || payload.source.conversationId || 'unknown'}`,
    `Commit: ${commitLabel(payload)}`,
    payload.metadata.compareUrl ? `Compare: ${String(payload.metadata.compareUrl)}` : '',
    `Resumo: ${sections.summary || payload.content.rawText}`,
    sections.impact ? `Impacto: ${sections.impact}` : '',
    'A IA encontrou problemas importantes neste commit:',
    ...findings.slice(0, 5).map((finding) => {
      const location = finding.file ? ` (${finding.file})` : '';
      const recommendation = finding.recommendation || 'Revise este ponto antes de seguir com a mudanca.';
      return [
        `- [${finding.severity.toUpperCase()}]${location}`,
        `  Problema: ${finding.summary}`,
        `  Como resolver: ${recommendation}`,
      ].join('\n');
    }),
  ];
  return lines.filter(Boolean).join('\n');
}
