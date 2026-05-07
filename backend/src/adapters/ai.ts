import { AiProvider, CanonicalType, Importance, KnowledgeKind, ReviewFindingSeverity } from '../contracts/enums.js';
import { conversationAgentDecisionSchema, type ConversationAgentDecision } from '../contracts/agent-conversation.js';
import { stripMarkdownFences } from '../domain/strings.js';

export type ReviewAnalysis = {
  summary: string;
  impact: string;
  risks: string[];
  nextSteps: string[];
  reviewFindings: Array<{
    severity: ReviewFindingSeverity;
    file: string;
    summary: string;
    recommendation: string;
  }>;
};

export type ConversationExtraction = {
  rawText?: string;
  projectSlug?: string;
  kind?: KnowledgeKind;
  canonicalType?: CanonicalType;
  importance?: Importance;
  tags?: string[];
  reminderDate?: string;
  reminderTime?: string;
};

export type KnowledgeAnswer = {
  answer: string;
  bullets: string[];
};

export type ConversationAgentTurnPayload = {
  messageText: string;
  currentState: unknown;
  availableProjects: Array<{
    projectSlug: string;
    displayName: string;
    aliases: string[];
    defaultTags: string[];
  }>;
  candidateProjectSlug: string;
  candidateFolders: Array<{
    id: string;
    displayName: string;
    fullSlugPath: string;
    children: unknown[];
  }>;
};

type ChatConfig = {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
};

async function runChatCompletion(
  config: ChatConfig,
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  if (config.provider === AiProvider.None || !config.apiKey || !config.model) return '';
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return stripMarkdownFences(data.choices?.[0]?.message?.content || '');
}

async function runStructuredChatCompletion<T>(
  config: ChatConfig,
  systemPrompt: string,
  userContent: string,
  parse: (input: unknown) => T,
): Promise<T | null> {
  const content = await runChatCompletion(config, systemPrompt, userContent);
  if (!content) return null;
  return parse(JSON.parse(content));
}

export async function generateReviewAnalysis(
  config: ChatConfig,
  promptPayload: unknown,
): Promise<ReviewAnalysis> {
  const fallback: ReviewAnalysis = {
    summary: 'Push recebido sem analise de IA configurada.',
    impact: 'Nenhum impacto adicional foi resumido.',
    risks: [],
    nextSteps: [],
    reviewFindings: [],
  };

  if (config.provider === AiProvider.None || !config.apiKey || !config.model) return fallback;

  const content = await runChatCompletion(
    config,
    [
      'You are a senior software engineer performing code review.',
      'Return strict JSON with keys summary, impact, risks, nextSteps, reviewFindings.',
      'reviewFindings must be an array of { severity, file, summary, recommendation }.',
      'Write the content in Brazilian Portuguese.',
    ].join(' '),
    JSON.stringify(promptPayload),
  );
  if (!content) return fallback;
  const parsed = JSON.parse(content) as Partial<ReviewAnalysis>;
  return {
    summary: String(parsed.summary || fallback.summary),
    impact: String(parsed.impact || fallback.impact),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map((item) => String(item)) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map((item) => String(item)) : [],
    reviewFindings: Array.isArray(parsed.reviewFindings)
      ? parsed.reviewFindings
          .map((item) => item as Record<string, unknown>)
          .filter((item) => item.summary)
          .map((item) => ({
            severity: Object.values(ReviewFindingSeverity).includes(item.severity as ReviewFindingSeverity)
              ? (item.severity as ReviewFindingSeverity)
              : ReviewFindingSeverity.Medium,
            file: String(item.file || ''),
            summary: String(item.summary || ''),
            recommendation: String(item.recommendation || ''),
          }))
      : [],
  };
}

export async function extractConversationFields(
  config: ChatConfig,
  payload: {
    messageText: string;
    projectSlugs: string[];
  },
): Promise<ConversationExtraction | null> {
  return runStructuredChatCompletion(
    config,
    [
      'Extract structured fields from a WhatsApp knowledge-capture message written in Brazilian Portuguese.',
      `Use projectSlug only from this list when confident: ${payload.projectSlugs.join(', ') || 'inbox'}.`,
      'Return strict JSON with optional keys rawText, projectSlug, kind, canonicalType, importance, tags, reminderDate, reminderTime.',
      'Valid kind values: note, bug, summary, article, daily.',
      'Valid canonicalType values: event, knowledge, decision, incident.',
      'Dates must be YYYY-MM-DD and times HH:mm when explicit.',
      'Do not invent missing information.',
    ].join(' '),
    payload.messageText,
    (parsed) => (parsed && typeof parsed === 'object' ? (parsed as ConversationExtraction) : null),
  );
}

export async function decideConversationAgentTurn(
  config: ChatConfig,
  payload: ConversationAgentTurnPayload,
): Promise<ConversationAgentDecision | null> {
  return runStructuredChatCompletion(
    config,
    [
      'You orchestrate a multi-turn note capture flow in Brazilian Portuguese.',
      'Return strict JSON with keys replyText, resolvedDraft, selectedProjectSlug, selectedFolderId, suggestedFolderPath, pendingApproval, confidence, action.',
      'selectedProjectSlug must be one of the provided project slugs or "inbox". Never invent a new project.',
      'Use pendingApproval="folder_create" only when you are suggesting a folder path that still needs explicit approval before creation.',
      'Use pendingApproval="final_confirmation" only when the draft is ready and the user should confirm before persistence.',
      'Use action="ask" for missing or ambiguous information, "confirm" for approval questions, "submit" only when the user is clearly confirming a final summary, and "cancel" only when the user clearly wants to discard the flow.',
      'suggestedFolderPath must be an array of human-readable folder names.',
      'Do not mention internal JSON or implementation details.',
    ].join(' '),
    JSON.stringify(payload),
    (parsed) => conversationAgentDecisionSchema.parse(parsed),
  );
}

export async function answerKnowledgeQuery(
  config: ChatConfig,
  payload: {
    query: string;
    matches: Array<{
      path: string;
      title: string;
      snippet: string;
    }>;
  },
): Promise<KnowledgeAnswer | null> {
  return runStructuredChatCompletion(
    config,
    [
      'You answer questions about a knowledge base in Brazilian Portuguese.',
      'Use only the provided notes and never invent facts.',
      'Return strict JSON with keys answer, bullets.',
      'bullets must be an array of concise supporting points.',
    ].join(' '),
    JSON.stringify(payload),
    (parsed) => {
      const typed = parsed as Partial<KnowledgeAnswer>;
      return {
        answer: String(typed.answer || '').trim(),
        bullets: Array.isArray(typed.bullets) ? typed.bullets.map((item) => String(item || '').trim()).filter(Boolean) : [],
      };
    },
  );
}
