import { useCallback, useState } from 'react';

export const discardChangesConfirmationCopy = {
  cancelLabel: 'Continuar editando',
  confirmLabel: 'Fechar sem salvar',
  description: 'Você tem alterações não salvas. Tem certeza que deseja fechar este modal e perder os dados informados?',
  title: 'Descartar alterações?',
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
