import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  deleteWebhookSubscription,
  updateWebhookSubscription,
} from '../../shared/api/client';
import type { WebhookSubscription } from '../../shared/api/models/webhook-subscription';
import { notifySuccess } from '../../shared/ui/notifications';
import { WEBHOOK_MESSAGES } from './webhook.constants';
import { ConfirmationModal } from '../../shared/ui/confirmation-modal';
import { Badge } from '../../shared/ui/primitives';
import { PencilIcon, TrashIcon } from '../../shared/ui/icons';

interface SubscriptionRowProps {
  subscription: WebhookSubscription;
  workspaceSlug: string;
  onEdit: () => void;
}

export function SubscriptionRow({ subscription, workspaceSlug, onEdit }: SubscriptionRowProps) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => updateWebhookSubscription(subscription.id, { enabled: !subscription.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions', workspaceSlug] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteWebhookSubscription(subscription.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions', workspaceSlug] });
      notifySuccess(WEBHOOK_MESSAGES.MUTATION.DELETED);
    },
  });

  return (
    <>
      <div className="webhook-row">
        <div className="webhook-row-main">
          <strong>{subscription.label || subscription.url}</strong>
          <small className="mono">{subscription.url}</small>
        </div>
        <div className="webhook-row-actions">
          <Badge value={subscription.enabled ? WEBHOOK_MESSAGES.ROW.ACTIVE : WEBHOOK_MESSAGES.ROW.DISABLED} tone={subscription.enabled ? 'low' : 'medium'} />
          <button
            className="filter-chip"
            disabled={toggleMutation.isPending}
            type="button"
            onClick={() => toggleMutation.mutate()}
          >
            {subscription.enabled ? WEBHOOK_MESSAGES.ROW.DISABLE : WEBHOOK_MESSAGES.ROW.ENABLE}
          </button>
          <button
            className="row-action-button"
            title={WEBHOOK_MESSAGES.ROW.EDIT}
            type="button"
            onClick={onEdit}
          >
            <PencilIcon />
          </button>
          <button
            className="row-action-button danger"
            title={WEBHOOK_MESSAGES.ROW.DELETE}
            type="button"
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      {confirmDelete ? (
        <ConfirmationModal
          cancelLabel={WEBHOOK_MESSAGES.DELETE_CONFIRMATION.CANCEL}
          confirmLabel={WEBHOOK_MESSAGES.DELETE_CONFIRMATION.CONFIRM}
          description={WEBHOOK_MESSAGES.DELETE_CONFIRMATION.DESCRIPTION.replace('{label}', subscription.label || subscription.url)}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { deleteMutation.mutate(); setConfirmDelete(false); }}
          title={WEBHOOK_MESSAGES.DELETE_CONFIRMATION.TITLE}
          tone="danger"
        />
      ) : null}
    </>
  );
}
