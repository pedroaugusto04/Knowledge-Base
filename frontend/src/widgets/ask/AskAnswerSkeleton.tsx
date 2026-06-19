import { SEARCH_MESSAGES } from '../../pages/search/search.constants';
import { AskAiIcon } from './AskAiIcon';

interface AskAnswerSkeletonProps {
  question: string;
  projectLabel: string;
}

export function AskAnswerSkeleton({ question, projectLabel }: AskAnswerSkeletonProps) {
  return (
    <div className="ask-qa-card skeleton-card">
      <div className="ask-question-bubble">
        <span className="question-text">{question}</span>
        <span className="ask-project-chip">{projectLabel}</span>
      </div>
      <div className="ask-answer-container">
        <div className="ask-answer-header">
          <div className="ask-ai-identity">
            <AskAiIcon className="ask-ai-identity-icon ask-ai-pulse" />
            <strong>{SEARCH_MESSAGES.SKELETON.THINKING}</strong>
          </div>
        </div>
        <div className="ask-skeleton-lines">
          <div className="skeleton-line line-1"></div>
          <div className="skeleton-line line-2"></div>
          <div className="skeleton-line line-3"></div>
        </div>
      </div>
    </div>
  );
}
