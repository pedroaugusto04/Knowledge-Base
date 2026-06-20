import * as vscode from 'vscode';
import { AiHistoryProvider, AiSession } from './types';
import type { KbClient } from '../kb-client';

export class AiHistoryManager {
  private providers = new Map<string, AiHistoryProvider>();
  private activeDisposables: vscode.Disposable[] = [];
  private knownSessionTimes = new Map<string, number>(); // track last modified timestamps to avoid duplicates
  private recentSessions: AiSession[] = []; // store in memory to allow viewing/importing later
  private context?: vscode.ExtensionContext;
  private savedSessions = new Map<string, number>(); // key -> timestamp "providerId:sessionId"
  private ignoredSessions = new Map<string, number>(); // key -> timestamp "providerId:sessionId"
  private promptingSessions = new Set<string>(); // prevent overlapping popups for the same active session
  private readonly MAX_SAVED_SESSIONS = 200; // Maximum number of saved sessions to track
  private readonly MAX_IGNORED_SESSIONS = 500; // Maximum number of ignored sessions to track
  private readonly SESSION_TTL_DAYS = 60; // Remove sessions older than 60 days

  registerProvider(provider: AiHistoryProvider) {
    this.providers.set(provider.id, provider);
  }

  async startWatching(client: KbClient, context: vscode.ExtensionContext) {
    this.context = context;

    // Clean up active watchers
    for (const d of this.activeDisposables) {
      d.dispose();
    }
    this.activeDisposables = [];

    // Load persisted known session times
    try {
      const persistedTimes = context.globalState.get<[string, number][]>('kb.knownSessionTimes') || [];
      this.knownSessionTimes = new Map(persistedTimes);
    } catch {
      this.knownSessionTimes = new Map();
    }

    // Load persisted recent sessions
    try {
      this.recentSessions = context.globalState.get<AiSession[]>('kb.recentSessions') || [];
    } catch {
      this.recentSessions = [];
    }

    // Load persisted saved session keys
    try {
      const persistedSaved = context.globalState.get<[string, number][]>('kb.savedSessionsMap') || [];
      this.savedSessions = new Map(persistedSaved);
      this.enforceSessionLimits();
    } catch {
      this.savedSessions = new Map();
    }

    // Load persisted ignored session keys
    try {
      const persistedIgnored = context.globalState.get<[string, number][]>('kb.ignoredSessionsMap') || [];
      this.ignoredSessions = new Map(persistedIgnored);
      this.enforceSessionLimits();
    } catch {
      this.ignoredSessions = new Map();
    }

    // Load initial recent sessions from active providers to populate the list on startup
    for (const provider of this.providers.values()) {
      try {
        const enabled = await provider.isEnabled();
        if (!enabled) continue;
        const initial = await provider.getRecentSessions();
        for (const s of initial) {
          this.addOrUpdateRecentSession(s, true);
          
          // Record the timestamp of existing sessions so they don't trigger prompts
          const key = `${provider.id}:${s.sessionId}`;
          const currentKnownTime = this.knownSessionTimes.get(key) || 0;
          if (s.timestamp > currentKnownTime) {
            this.knownSessionTimes.set(key, s.timestamp);
          }
        }
      } catch (err) {
        console.error(`Failed to load initial sessions for ${provider.id}:`, err);
      }
    }

    this.saveState();

    for (const provider of this.providers.values()) {
      try {
        const enabled = await provider.isEnabled();
        if (!enabled) continue;

        const disposable = provider.watchSessions(async (session) => {
          const key = `${provider.id}:${session.sessionId}`;
          const lastTime = this.knownSessionTimes.get(key) || 0;
          if (session.timestamp <= lastTime) {
            return; // Already processed this or newer version
          }
          this.knownSessionTimes.set(key, session.timestamp);
          this.addOrUpdateRecentSession(session);

          // If the session is already saved (auto-save enabled)
          if (this.savedSessions.has(key)) {
            await this.autoSaveSessionToVault(client, session);
            return;
          }

          // If the session is ignored, do nothing
          if (this.ignoredSessions.has(key)) {
            return;
          }

          // If a popup is already open for this session, do not open another one.
          if (this.promptingSessions.has(key)) {
            return;
          }

          this.promptingSessions.add(key);
          try {
            const action = await vscode.window.showInformationMessage(
              `KB: New AI session detected from ${provider.name}. Do you want to save it as a note?`,
              'Auto-save',
              'Preview & Edit',
              'Ignore'
            );

            if (action === 'Auto-save') {
              this.markSessionAsSaved(provider.id, session.sessionId);
              await this.saveSessionToVault(client, session);
            } else if (action === 'Preview & Edit') {
              await this.openPreview(session);
            } else if (action === 'Ignore') {
              this.markSessionAsIgnored(provider.id, session.sessionId);
            }
          } finally {
            this.promptingSessions.delete(key);
          }
        });

        this.activeDisposables.push(disposable);
        context.subscriptions.push(disposable);
      } catch (err) {
        console.error(`Failed to start watcher for provider ${provider.id}:`, err);
      }
    }
  }

  markSessionAsSaved(providerId: string, sessionId: string) {
    const key = `${providerId}:${sessionId}`;
    this.savedSessions.set(key, Date.now());
    this.ignoredSessions.delete(key);
    this.enforceSessionLimits();
    this.saveState();
  }

  markSessionAsIgnored(providerId: string, sessionId: string) {
    const key = `${providerId}:${sessionId}`;
    this.ignoredSessions.set(key, Date.now());
    this.savedSessions.delete(key);
    this.enforceSessionLimits();
    this.saveState();
  }

  private enforceSessionLimits() {
    const now = Date.now();
    const ttlMs = this.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

    // Remove entries older than TTL from both sets
    for (const [key, timestamp] of this.savedSessions.entries()) {
      if (now - timestamp > ttlMs) {
        this.savedSessions.delete(key);
      }
    }

    for (const [key, timestamp] of this.ignoredSessions.entries()) {
      if (now - timestamp > ttlMs) {
        this.ignoredSessions.delete(key);
      }
    }

    // Enforce limit on saved sessions using LRU (remove oldest by timestamp)
    if (this.savedSessions.size > this.MAX_SAVED_SESSIONS) {
      const entries = Array.from(this.savedSessions.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by timestamp ascending (oldest first)
      const toRemove = entries.slice(0, entries.length - this.MAX_SAVED_SESSIONS);
      for (const [key] of toRemove) {
        this.savedSessions.delete(key);
      }
    }

    // Enforce limit on ignored sessions using LRU (remove oldest by timestamp)
    if (this.ignoredSessions.size > this.MAX_IGNORED_SESSIONS) {
      const entries = Array.from(this.ignoredSessions.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by timestamp ascending (oldest first)
      const toRemove = entries.slice(0, entries.length - this.MAX_IGNORED_SESSIONS);
      for (const [key] of toRemove) {
        this.ignoredSessions.delete(key);
      }
    }
  }

  private saveState() {
    if (!this.context) return;
    try {
      const timesArray = Array.from(this.knownSessionTimes.entries());
      this.context.globalState.update('kb.knownSessionTimes', timesArray);
      this.context.globalState.update('kb.recentSessions', this.recentSessions);
      this.context.globalState.update('kb.savedSessionsMap', Array.from(this.savedSessions.entries()));
      this.context.globalState.update('kb.ignoredSessionsMap', Array.from(this.ignoredSessions.entries()));
    } catch (err) {
      console.error('Failed to save AI sessions state:', err);
    }
  }

  private addOrUpdateRecentSession(session: AiSession, skipSave = false) {
    const existingIdx = this.recentSessions.findIndex(
      s => s.providerId === session.providerId && s.sessionId === session.sessionId
    );
    if (existingIdx >= 0) {
      this.recentSessions[existingIdx] = session;
    } else {
      this.recentSessions.push(session);
    }

    // Sort by timestamp descending (newest first)
    this.recentSessions.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to recent 20
    if (this.recentSessions.length > 20) {
      this.recentSessions = this.recentSessions.slice(0, 20);
    }

    if (!skipSave) {
      this.saveState();
    }
  }

  async showRecentSessions(client: KbClient) {
    // 1. Scan all sessions dynamically from all active providers
    const allSessions: AiSession[] = [];
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning AI session logs...',
      cancellable: false
    }, async () => {
      for (const provider of this.providers.values()) {
        try {
          const enabled = await provider.isEnabled();
          if (!enabled) continue;
          const sessions = await provider.getRecentSessions();
          allSessions.push(...sessions);
        } catch (err) {
          console.error(`Failed to load sessions for ${provider.id}:`, err);
        }
      }
    });

    // Sort all sessions by timestamp descending (newest first)
    allSessions.sort((a, b) => b.timestamp - a.timestamp);

    if (allSessions.length === 0) {
      vscode.window.showInformationMessage('No recent AI sessions detected from Claude Code or Codex.');
      return;
    }

    interface SessionQuickPickItem extends vscode.QuickPickItem {
      session?: AiSession;
      isLoadMore?: boolean;
    }

    // 2. Set up QuickPick for pagination / infinite scroll
    const quickPick = vscode.window.createQuickPick<SessionQuickPickItem>();
    quickPick.title = 'Select a recent AI session to import';
    quickPick.placeholder = 'Search by title...';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    const PAGE_SIZE = 20;
    let displayedCount = PAGE_SIZE;

    // Helper to build list of items
    const getItems = (filterQuery = '') => {
      const filtered = filterQuery
        ? allSessions.filter(s => s.title.toLowerCase().includes(filterQuery.toLowerCase()))
        : allSessions;

      const slice = filtered.slice(0, displayedCount);
      const items: SessionQuickPickItem[] = slice.map(session => ({
        label: session.title,
        description: this.providers.get(session.providerId)?.name || session.providerId,
        detail: `Modified: ${new Date(session.timestamp).toLocaleString()}`,
        session
      }));

      // Add "Load More" indicator if there are remaining sessions
      if (filtered.length > displayedCount) {
        items.push({
          label: '$(arrow-down) Load More...',
          description: `Showing ${displayedCount} of ${filtered.length} sessions`,
          detail: 'Select this item or scroll down to load more',
          isLoadMore: true
        });
      }

      return items;
    };

    quickPick.items = getItems();

    // 3. Handle infinite scroll / selection change (throttled)
    let isHandlingActiveChange = false;
    quickPick.onDidChangeActive(active => {
      if (isHandlingActiveChange) return;
      const activeItem = active[0];
      if (!activeItem) return;

      const items = quickPick.items;
      const activeIndex = items.indexOf(activeItem);

      // Trigger if active item is "Load More..." or is in the last 2 positions and "Load More" exists
      if (activeItem.isLoadMore || (activeIndex >= items.length - 2 && items[items.length - 1].isLoadMore)) {
        isHandlingActiveChange = true;
        
        setTimeout(() => {
          displayedCount += PAGE_SIZE;
          
          const query = quickPick.value;
          quickPick.items = getItems(query);
          
          // Re-focus near the previous position
          const newIndex = Math.min(activeIndex, quickPick.items.length - 1);
          quickPick.activeItems = [quickPick.items[newIndex]];
          
          isHandlingActiveChange = false;
        }, 150);
      }
    });

    // Reset page count on filter query change
    quickPick.onDidChangeValue(value => {
      displayedCount = PAGE_SIZE;
      quickPick.items = getItems(value);
    });

    // Handle item acceptance
    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0];
      if (!selected) return;

      if (selected.isLoadMore) {
        displayedCount += PAGE_SIZE;
        quickPick.items = getItems(quickPick.value);
        return;
      }

      quickPick.hide();
      quickPick.dispose();

      if (selected.session) {
        const action = await vscode.window.showInformationMessage(
          `Selected session: "${selected.label}"`,
          'Auto-save',
          'Preview & Edit'
        );
        if (action === 'Auto-save') {
          this.markSessionAsSaved(selected.session.providerId, selected.session.sessionId);
          await this.saveSessionToVault(client, selected.session);
        } else if (action === 'Preview & Edit') {
          await this.openPreview(selected.session);
        }
      }
    });

    quickPick.onDidHide(() => {
      quickPick.dispose();
    });

    quickPick.show();
  }

  private getTitleWithDate(session: AiSession): string {
    const dateObj = new Date(session.timestamp);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return `${session.title} (${formattedDate})`;
  }

  private getMarkdownText(session: AiSession): string {
    const titleWithDate = this.getTitleWithDate(session);
    let rawText = `# ${titleWithDate}\n\n`;
    rawText += `Source: ${this.providers.get(session.providerId)?.name || session.providerId}\n`;
    if (session.projectSlug) {
      rawText += `Project: ${session.projectSlug}\n`;
    }
    rawText += `\n---\n\n`;
    
    for (const turn of session.turns) {
      const roleHeader = turn.role === 'user' ? '👤 User' : '🤖 Assistant';
      rawText += `### ${roleHeader}\n${turn.content}\n\n`;
    }
    return rawText;
  }

  async openPreview(session: AiSession) {
    try {
      const rawText = this.getMarkdownText(session);
      const doc = await vscode.workspace.openTextDocument({
        content: rawText,
        language: 'markdown',
      });
      await vscode.window.showTextDocument(doc);
      
      const choice = await vscode.window.showInformationMessage(
        'KB: You are viewing the AI conversation. Edit the file as you wish, then choose Save Now.',
        'Save Now'
      );
      if (choice === 'Save Now') {
        vscode.commands.executeCommand('kb.saveActiveFile', session.sessionId, session.providerId);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open preview: ${err.message || err}`);
    }
  }

  private async saveSessionToVault(client: KbClient, session: AiSession) {
    try {
      const titleWithDate = this.getTitleWithDate(session);
      const rawText = this.getMarkdownText(session);
      await client.createNote({
        title: titleWithDate,
        rawText,
        projectSlug: session.projectSlug || client.defaultProjectSlug || 'inbox',
        sourceChannel: 'ai-chat',
        source: session.providerId,
        sessionId: session.sessionId,
      });

      vscode.window.showInformationMessage('Note saved to Knowledge Vault successfully!');
      vscode.commands.executeCommand('kb.refresh');
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to save note: ${err.message || err}`);
    }
  }

  private async autoSaveSessionToVault(client: KbClient, session: AiSession) {
    try {
      const titleWithDate = this.getTitleWithDate(session);
      const rawText = this.getMarkdownText(session);
      await client.createNote({
        title: titleWithDate,
        rawText,
        projectSlug: session.projectSlug || client.defaultProjectSlug || 'inbox',
        sourceChannel: 'ai-chat',
        source: session.providerId,
        sessionId: session.sessionId,
      });

      vscode.commands.executeCommand('kb.refresh');
    } catch (err: any) {
      console.error(`Failed to auto-save note: ${err.message || err}`);
    }
  }
}
