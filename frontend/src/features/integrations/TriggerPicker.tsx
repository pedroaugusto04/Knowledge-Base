import type { WebhookTriggerDefinition } from '../../shared/api/models/webhook-subscription';

interface TriggerPickerProps {
  triggers: WebhookTriggerDefinition[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function TriggerPicker({ triggers, selected, onChange, disabled = false }: TriggerPickerProps) {
  const groups: Record<string, WebhookTriggerDefinition[]> = {};
  for (const t of triggers) (groups[t.group] ??= []).push(t);

  const toggle = (trigger: string) => {
    onChange(
      selected.includes(trigger)
        ? selected.filter((s) => s !== trigger)
        : [...selected, trigger],
    );
  };

  return (
    <div className="webhook-trigger-picker">
      {Object.entries(groups).map(([group, items]) => (
        <fieldset key={group} className="webhook-trigger-group">
          <legend>{group.charAt(0).toUpperCase() + group.slice(1)}</legend>
          {items.map((t) => (
            <label key={t.trigger} className="webhook-trigger-option">
              <input
                checked={selected.includes(t.trigger)}
                disabled={disabled}
                type="checkbox"
                onChange={() => toggle(t.trigger)}
              />
              <span>
                <strong>{t.label}</strong>
                <small>{t.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
