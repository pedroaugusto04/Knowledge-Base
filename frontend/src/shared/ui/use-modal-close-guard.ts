import { useCallback, useState } from 'react';

export const discardChangesConfirmationCopy = {
  cancelLabel: 'Keep editing',
  confirmLabel: 'Close without saving',
  description: 'You have unsaved changes. Are you sure you want to close this modal and lose the entered data?',
  title: 'Discard changes?',
} as const;

export function useModalCloseGuard({ isDirty, onClose }: { isDirty: boolean; onClose: () => void }) {
  const [isDiscardConfirmationOpen, setIsDiscardConfirmationOpen] = useState(false);

  const requestClose = useCallback(() => {
    if (!isDirty) {
      setIsDiscardConfirmationOpen(false);
      onClose();
      return;
    }
    setIsDiscardConfirmationOpen(true);
  }, [isDirty, onClose]);

  const confirmClose = useCallback(() => {
    setIsDiscardConfirmationOpen(false);
    onClose();
  }, [onClose]);

  const cancelClose = useCallback(() => {
    setIsDiscardConfirmationOpen(false);
  }, []);

  const resetCloseGuard = useCallback(() => {
    setIsDiscardConfirmationOpen(false);
  }, []);

  return {
    cancelClose,
    confirmClose,
    isDiscardConfirmationOpen,
    requestClose,
    resetCloseGuard,
  };
}
