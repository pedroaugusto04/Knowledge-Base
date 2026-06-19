import { useState, useEffect } from 'react';
import { fetchNoteTemplates, createNoteTemplate, updateNoteTemplate, deleteNoteTemplate } from '../../shared/api/note-templates';
import type { NoteTemplate, CreateNoteTemplateInput, UpdateNoteTemplateInput } from '../../shared/api/models/note-template';

export function NoteTemplatesManager({ workspaceSlug }: { workspaceSlug: string }) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [workspaceSlug]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const result = await fetchNoteTemplates(workspaceSlug);
      setTemplates(result.templates);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(input: CreateNoteTemplateInput) {
    try {
      await createNoteTemplate(input);
      setShowCreateForm(false);
      loadTemplates();
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
    }
  }

  async function handleUpdate(id: string, input: UpdateNoteTemplateInput) {
    try {
      await updateNoteTemplate(id, input);
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      setError('Failed to update template');
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteNoteTemplate(id);
      loadTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  }

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="note-templates-manager">
      <div className="header">
        <h2>Note Templates</h2>
        <button onClick={() => setShowCreateForm(true)}>Create Template</button>
      </div>

      <div className="templates-list">
        {templates.map((template) => (
          <div key={template.id} className="template-item">
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            {template.isDefault && <span className="badge">Default</span>}
            <div className="actions">
              <button onClick={() => setEditingTemplate(template)}>Edit</button>
              <button onClick={() => handleDelete(template.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <CreateNoteTemplateForm
          workspaceSlug={workspaceSlug}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTemplate && (
        <UpdateNoteTemplateForm
          template={editingTemplate}
          onSubmit={(input) => handleUpdate(editingTemplate.id, input)}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

function CreateNoteTemplateForm({
  workspaceSlug,
  onSubmit,
  onCancel,
}: {
  workspaceSlug: string;
  onSubmit: (input: CreateNoteTemplateInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [canonicalType, setCanonicalType] = useState('');
  const [defaultTags, setDefaultTags] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateNoteTemplateInput = {
      workspaceSlug,
      name,
      description,
      canonicalType: canonicalType || undefined,
      defaultTags: defaultTags.split(',').map(t => t.trim()).filter(Boolean),
      defaultStatus: defaultStatus || undefined,
      sections: [],
      isDefault,
    };
    await onSubmit(input);
  }

  return (
    <div className="template-form-overlay">
      <form onSubmit={handleSubmit} className="template-form">
        <h3>Create Template</h3>
        
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label>
          Canonical Type
          <select
            value={canonicalType}
            onChange={(e) => setCanonicalType(e.target.value)}
          >
            <option value="">None</option>
            <option value="event">Event</option>
            <option value="knowledge">Knowledge</option>
            <option value="decision">Decision</option>
            <option value="incident">Incident</option>
            <option value="followup">Followup</option>
          </select>
        </label>

        <label>
          Default Tags (comma-separated)
          <input
            type="text"
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
          />
        </label>

        <label>
          Default Status
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
          >
            <option value="">None</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Set as default template
        </label>

        <div className="form-actions">
          <button type="submit">Create</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function UpdateNoteTemplateForm({
  template,
  onSubmit,
  onCancel,
}: {
  template: NoteTemplate;
  onSubmit: (input: UpdateNoteTemplateInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [canonicalType, setCanonicalType] = useState(template.canonicalType || '');
  const [defaultTags, setDefaultTags] = useState(template.defaultTags.join(', '));
  const [defaultStatus, setDefaultStatus] = useState(template.defaultStatus || '');
  const [isDefault, setIsDefault] = useState(template.isDefault);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: UpdateNoteTemplateInput = {
      name,
      description,
      canonicalType: canonicalType || undefined,
      defaultTags: defaultTags.split(',').map(t => t.trim()).filter(Boolean),
      defaultStatus: defaultStatus || undefined,
      sections: template.sections,
      isDefault,
    };
    await onSubmit(input);
  }

  return (
    <div className="template-form-overlay">
      <form onSubmit={handleSubmit} className="template-form">
        <h3>Edit Template</h3>
        
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label>
          Canonical Type
          <select
            value={canonicalType}
            onChange={(e) => setCanonicalType(e.target.value)}
          >
            <option value="">None</option>
            <option value="event">Event</option>
            <option value="knowledge">Knowledge</option>
            <option value="decision">Decision</option>
            <option value="incident">Incident</option>
            <option value="followup">Followup</option>
          </select>
        </label>

        <label>
          Default Tags (comma-separated)
          <input
            type="text"
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
          />
        </label>

        <label>
          Default Status
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
          >
            <option value="">None</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Set as default template
        </label>

        <div className="form-actions">
          <button type="submit">Update</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
