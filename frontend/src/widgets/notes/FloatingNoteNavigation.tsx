import React from 'react';

type FloatingNoteNavigationProps = {
  previousNoteId?: string | null;
  nextNoteId?: string | null;
  onPrevious: () => void;
  onNext: () => void;
  isMobile?: boolean;
};

export function FloatingNoteNavigation({
  previousNoteId,
  nextNoteId,
  onPrevious,
  onNext,
  isMobile = false,
}: FloatingNoteNavigationProps) {
  // No mobile, swipe gesture is primary interaction, so don't show floating buttons
  if (isMobile) return null;

  if (!previousNoteId && !nextNoteId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
      }}
    >
      {previousNoteId && (
        <button
          className="icon-button"
          type="button"
          onClick={onPrevious}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-strong)',
          }}
          title="Previous note"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {nextNoteId && (
        <button
          className="icon-button"
          type="button"
          onClick={onNext}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-strong)',
          }}
          title="Next note"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
