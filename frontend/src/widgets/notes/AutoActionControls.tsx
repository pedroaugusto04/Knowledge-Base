import React, { useState } from 'react';

type Props = {
  noteId: string;
  initialAction?: 'none' | 'resolved' | 'archived';
  initialAfterHours?: number | null;
  onSaved?: () => void;
};

export function AutoActionControls({ noteId, initialAction = 'none', initialAfterHours = null, onSaved }: Props) {
  const [action, setAction] = useState(initialAction);
  const [hours, setHours] = useState<number | ''>(initialAfterHours ?? '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAction: action, autoAfterHours: hours === '' ? null : Number(hours), rawText: 'noop' }),
      });
      onSaved?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label>
        Auto action
        <select value={action} onChange={(e) => setAction(e.target.value as any)}>
          <option value="none">No auto-action</option>
          <option value="resolved">Mark resolved</option>
          <option value="archived">Archive</option>
        </select>
      </label>
      <label>
        After hours
        <input type="number" min={1} value={hours as any} onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
      <button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
    </div>
  );
}

export default AutoActionControls;
