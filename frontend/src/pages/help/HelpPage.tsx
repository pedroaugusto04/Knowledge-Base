import { useState } from 'react';
import './HelpPage.css';

type SectionId =
  | 'overview'
  | 'projects'
  | 'ai-chat'
  | 'integrations'
  | 'cli'
  | 'vscode'
  | 'reminders'
  | 'map';

interface HelpSection {
  id: SectionId;
  label: string;
  icon: string;
  title: string;
  description: string;
  items: HelpItem[];
}

interface HelpItem {
  title: string;
  body: string;
  code?: string;
  tip?: string;
}

const sections: HelpSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '◈',
    title: 'What is Knowledge Vault?',
    description:
      'Knowledge Vault centralizes your team\'s operational knowledge — decisions, routines, and context — in one place. Instead of hunting through chats and docs, everything your team knows is searchable and queryable with AI.',
    items: [
      {
        title: 'Zero context loss',
        body: 'Every decision, routine, and exception is recorded. New team members get up to speed in minutes, not weeks.',
      },
      {
        title: 'Invisible capture',
        body: 'Knowledge flows in where work happens: WhatsApp audio messages, Telegram alerts, GitHub pushes, VS Code, and the CLI.',
      },
      {
        title: 'AI-powered retrieval',
        body: 'Ask questions in natural language. The AI answers from your actual project data, not generic internet knowledge.',
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects & Notes',
    icon: '⬡',
    title: 'Projects & Notes',
    description:
      'Projects organize your knowledge into focused areas. Each project is a living hub — notes, decisions, and AI-generated briefs all in one place.',
    items: [
      {
        title: 'Creating a project',
        body: 'Open the Projects page from the sidebar. Click "New project", give it a name and slug. The slug is used in CLI and integration references.',
      },
      {
        title: 'Adding notes',
        body: 'Inside any project, click "New note" to create a note manually. Notes support markdown and metadata like tags, reminders, and file attachments.',
      },
      {
        title: 'Project Brief',
        body: 'The AI-generated project brief summarizes the latest activity and key decisions in a project. Open a project and click "Brief" to generate or refresh it.',
      },
      {
        title: 'Folders',
        body: 'Notes can be organized into folders within a project. Create folders when editing or creating a note to group related content.',
        tip: 'Use folders to separate concerns: "Architecture", "Incidents", "Decisions".',
      },
    ],
  },
  {
    id: 'ai-chat',
    label: 'Ask AI',
    icon: '⟡',
    title: 'AI-Powered Chat',
    description:
      'The Ask AI page is a chat interface grounded in your knowledge base. Ask questions, filter by project, and get answers with source citations.',
    items: [
      {
        title: 'Asking a question',
        body: 'Navigate to "Ask AI" in the sidebar. Type any question about your projects, past decisions, or technical context. The AI retrieves relevant notes and synthesizes an answer.',
      },
      {
        title: 'Filtering by project',
        body: 'Use the project filter at the top of the Ask AI page to scope responses to a specific project. This improves precision for project-specific queries.',
      },
      {
        title: 'Conversation history',
        body: 'Your conversations are saved. Each session is stored as a note in your knowledge base and can be re-opened from the AI history panel.',
      },
      {
        title: 'WhatsApp /ask command',
        body: 'Once WhatsApp is connected, send "/ask <your question>" to the Knowledge Vault bot to get AI answers directly in your chat.',
        code: '/ask what was decided about the auth architecture last week?',
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: '⟁',
    title: 'Integrations',
    description:
      'Connect your existing tools so knowledge is captured where work happens — without switching context.',
    items: [
      {
        title: 'WhatsApp',
        body: 'Send audio or text messages to the Knowledge Vault WhatsApp bot. Audio is transcribed and structured into notes. Use /ask to search your knowledge base directly from the chat.',
        tip: 'Go to Settings → Integrations → WhatsApp and follow the QR code pairing flow.',
      },
      {
        title: 'Telegram',
        body: 'Connect Telegram to receive pipeline failure alerts, code review summaries, and GitHub push notifications directly in your Telegram.',
        tip: 'Go to Settings → Integrations → Telegram and paste your bot token.',
      },
      {
        title: 'GitHub Push',
        body: 'When you push to a connected repository, the system analyzes commits and diffs with AI, stores technical summaries, and optionally sends WhatsApp alerts for relevant issues.',
        code: '# In your repository settings on GitHub:\n# Add webhook: https://your-app.com/api/github/webhook\n# Content type: application/json\n# Events: Push',
        tip: 'Go to Settings → Integrations → GitHub and follow the webhook setup guide.',
      },
    ],
  },
  {
    id: 'cli',
    label: 'CLI Tool',
    icon: '>_',
    title: 'CLI Tool (kb)',
    description:
      'The kb CLI syncs local files, directories, and AI session histories directly to your knowledge base from the terminal.',
    items: [
      {
        title: 'Installation',
        body: 'Install the CLI globally via npm and initialize it with your API token.',
        code: 'npm install -g @pedroaugusto04/kb-cli\nkb init',
      },
      {
        title: 'Syncing AI sessions',
        body: 'Sync AI assistant sessions (Claude Code, Codex, Antigravity, OpenCode) to your knowledge base. The CLI reads local session files and sends them as structured notes.',
        code: 'kb sync-ai',
      },
      {
        title: 'Syncing files and directories',
        body: 'Send individual files or entire directories to the knowledge base.',
        code: 'kb sync --file ./README.md\nkb sync --dir ./docs',
      },
      {
        title: 'Finding your API token',
        body: 'Go to Profile → API Tokens in the app to generate a personal access token. Use it when running kb init.',
        tip: 'Tokens are scoped to your workspace. Never commit them to version control.',
      },
    ],
  },
  {
    id: 'vscode',
    label: 'VS Code Extension',
    icon: '⌨',
    title: 'VS Code Extension',
    description:
      'The Knowledge Vault VS Code extension brings the knowledge base into your editor. Save code selections, ask questions without leaving VS Code, and import AI session history.',
    items: [
      {
        title: 'Installation',
        body: 'Open VS Code → Extensions panel → Search for "Knowledge Vault" → Install.',
        tip: 'After installing, run the "Knowledge Vault: Sign In" command to authenticate.',
      },
      {
        title: 'Saving code snippets',
        body: 'Select any code → Right-click → "Save to Knowledge Vault". The snippet is stored as a note in your selected project with file path and language metadata.',
      },
      {
        title: 'Quick AI questions',
        body: 'Use the keyboard shortcut or Command Palette to open the Knowledge Vault sidebar chat. Ask questions about your knowledge base without switching tabs.',
      },
      {
        title: 'Importing AI session history',
        body: 'The extension detects AI assistant sessions (Claude, Codex, etc.) in your workspace and lets you import them to the knowledge base in one click from the sidebar.',
      },
    ],
  },
  {
    id: 'reminders',
    label: 'Reminders',
    icon: '◷',
    title: 'Reminders',
    description:
      'Attach reminders to notes so important decisions, reviews, or follow-ups surface at the right time — delivered via WhatsApp.',
    items: [
      {
        title: 'Setting a reminder',
        body: 'When creating or editing a note, set a reminder date and time. The system will send you a WhatsApp message with the note content at that time.',
        tip: 'WhatsApp must be connected for reminder delivery to work.',
      },
      {
        title: 'Viewing reminders',
        body: 'Navigate to "Reminders" in the sidebar to see all upcoming reminders across your projects, sorted by due date.',
      },
    ],
  },
  {
    id: 'map',
    label: 'Knowledge Map',
    icon: '⬡',
    title: 'Knowledge Map',
    description:
      'The Knowledge Map visualizes connections between notes, projects, and topics as an interactive graph — helping you discover relationships and patterns in your knowledge.',
    items: [
      {
        title: 'Navigating the map',
        body: 'Open the "Map" page from the sidebar. Nodes represent notes and projects. Edges represent connections (shared tags, links, or topic similarity). Drag to pan, scroll to zoom.',
      },
      {
        title: 'Filtering by project',
        body: 'Use the project filter in the map view to focus on a single project\'s knowledge graph.',
      },
      {
        title: 'Clicking a node',
        body: 'Click any note node to open it. The graph updates to highlight connected nodes.',
        tip: 'Use the map when you want to explore relationships rather than search for a specific answer.',
      },
    ],
  },
];

export function HelpPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const current = sections.find((s) => s.id === activeSection)!;

  function toggleItem(key: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="help-page">
      <div className="help-sidebar">
        <div className="help-sidebar-header">
          <span className="help-sidebar-icon">?</span>
          <div>
            <strong>Documentation</strong>
            <small>Knowledge Vault guide</small>
          </div>
        </div>
        <nav className="help-nav" aria-label="Help sections">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`help-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="help-nav-icon">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
        <div className="help-sidebar-footer">
          <a
            className="help-external-link"
            href="https://github.com/pedroaugusto04/Knowledge-Base"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>

      <div className="help-content">
        <div className="help-content-header">
          <div className="help-section-icon">{current.icon}</div>
          <div>
            <h1 className="help-section-title">{current.title}</h1>
            <p className="help-section-description">{current.description}</p>
          </div>
        </div>

        <div className="help-items">
          {current.items.map((item, i) => {
            const key = `${current.id}-${i}`;
            const isExpanded = expandedItems.has(key);
            return (
              <div key={key} className={`help-item ${isExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="help-item-header"
                  onClick={() => toggleItem(key)}
                  aria-expanded={isExpanded}
                >
                  <span className="help-item-title">{item.title}</span>
                  <svg
                    className="help-item-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="help-item-body">
                    <p>{item.body}</p>
                    {item.code && (
                      <pre className="help-code-block"><code>{item.code}</code></pre>
                    )}
                    {item.tip && (
                      <div className="help-tip">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span>{item.tip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="help-content-footer">
          <div className="help-nav-footer-row">
            {sections.findIndex((s) => s.id === activeSection) > 0 && (
              <button
                type="button"
                className="help-page-nav-btn"
                onClick={() => {
                  const idx = sections.findIndex((s) => s.id === activeSection);
                  setActiveSection(sections[idx - 1].id);
                }}
              >
                ← {sections[sections.findIndex((s) => s.id === activeSection) - 1].label}
              </button>
            )}
            {sections.findIndex((s) => s.id === activeSection) < sections.length - 1 && (
              <button
                type="button"
                className="help-page-nav-btn next"
                onClick={() => {
                  const idx = sections.findIndex((s) => s.id === activeSection);
                  setActiveSection(sections[idx + 1].id);
                }}
              >
                {sections[sections.findIndex((s) => s.id === activeSection) + 1].label} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
