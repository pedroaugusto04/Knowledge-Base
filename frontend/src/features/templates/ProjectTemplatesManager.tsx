import { useState, useEffect } from 'react';
import { fetchProjectTemplates, createProjectTemplate, updateProjectTemplate, deleteProjectTemplate } from '../../shared/api/project-templates';
import type { ProjectTemplate, CreateProjectTemplateInput, UpdateProjectTemplateInput } from '../../shared/api/models/project-template';

export function ProjectTemplatesManager({ workspaceSlug }: { workspaceSlug: string }) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [workspaceSlug]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const result = await fetchProjectTemplates(workspaceSlug);
      setTemplates(result.templates);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(input: CreateProjectTemplateInput) {
    try {
      await createProjectTemplate(input);
      setShowCreateForm(false);
      loadTemplates();
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
    }
  }

  async function handleUpdate(id: string, input: UpdateProjectTemplateInput) {
    try {
      await updateProjectTemplate(id, input);
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
      await deleteProjectTemplate(id);
      loadTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  }

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="project-templates-manager">
      <div className="header">
        <h2>Project Templates</h2>
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
        <CreateProjectTemplateForm
          workspaceSlug={workspaceSlug}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTemplate && (
        <UpdateProjectTemplateForm
          template={editingTemplate}
          onSubmit={(input) => handleUpdate(editingTemplate.id, input)}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

function CreateProjectTemplateForm({
  workspaceSlug,
  onSubmit,
  onCancel,
}: {
  workspaceSlug: string;
  onSubmit: (input: CreateProjectTemplateInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTags, setDefaultTags] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CreateProjectTemplateInput = {
      workspaceSlug,
      name,
      description,
      defaultTags: defaultTags.split(',').map(t => t.trim()).filter(Boolean),
      fields: [],
      folders: [],
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
          Default Tags (comma-separated)
          <input
            type="text"
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
          />
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

function UpdateProjectTemplateForm({
  template,
  onSubmit,
  onCancel,
}: {
  template: ProjectTemplate;
  onSubmit: (input: UpdateProjectTemplateInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [defaultTags, setDefaultTags] = useState(template.defaultTags.join(', '));
  const [isDefault, setIsDefault] = useState(template.isDefault);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: UpdateProjectTemplateInput = {
      name,
      description,
      defaultTags: defaultTags.split(',').map(t => t.trim()).filter(Boolean),
      fields: template.fields,
      folders: template.folders,
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
          Default Tags (comma-separated)
          <input
            type="text"
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
          />
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
