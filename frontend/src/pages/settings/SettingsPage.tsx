import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAutoActionGlobal, setAutoActionGlobal } from '../../shared/api/client';
import { notifySuccess, notifyGeneralFormError } from '../../shared/ui/notifications';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(['autoActionGlobal'], () => fetchAutoActionGlobal());
  const [enabled, setEnabled] = useState<boolean>(data?.enabled ?? false);
  const [action, setAction] = useState<'none' | 'resolved' | 'archived'>(data?.action ?? 'none');
  const [afterHours, setAfterHours] = useState<number | ''>(data?.afterHours ?? '');

  React.useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setAction(data.action);
      setAfterHours(data.afterHours ?? '');
    }
  }, [data]);

  const mutation = useMutation((payload: { enabled: boolean; action: 'none' | 'resolved' | 'archived'; afterHours?: number | null }) =>
    setAutoActionGlobal(payload),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['autoActionGlobal']);
      notifySuccess('Global auto-action saved');
    },
    onError: (err) => notifyGeneralFormError(err, 'Could not save settings'),
  });

  function onSave() {
    const payload = { enabled, action, afterHours: afterHours === '' ? null : Number(afterHours) };
    mutation.mutate(payload);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Automation — Notes</h2>
      <p>Configure global auto-action for notes (applied in batch by the worker).</p>
      {isLoading ? <div>Loading...</div> : (
        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enable global auto-action
          </label>

          <label>
            Action
            <select value={action} onChange={(e) => setAction(e.target.value as any)}>
              <option value="none">None</option>
              <option value="resolved">Mark resolved</option>
              <option value="archived">Archive</option>
            </select>
          </label>

          <label>
            After hours
            <input type="number" min={1} value={afterHours as any} onChange={(e) => setAfterHours(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSave} disabled={mutation.isLoading}>{mutation.isLoading ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { queryClient.invalidateQueries(['autoActionGlobal']); }} disabled={mutation.isLoading}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
