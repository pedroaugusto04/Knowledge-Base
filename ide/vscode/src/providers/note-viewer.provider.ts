import * as vscode from 'vscode';

export class KoteNoteContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;
  private notes = new Map<string, string>();

  setNoteContent(noteId: string, markdown: string) {
    this.notes.set(noteId, markdown);
    this._onDidChange.fire(vscode.Uri.parse(`kote-note://note/${noteId}.md`));
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    const matches = uri.path.match(/\/note\/(.+)\.md$/);
    if (!matches || !matches[1]) {
      return '# Error\nInvalid note URI.';
    }
    const noteId = matches[1];
    return this.notes.get(noteId) || '# Error\nNote content not loaded.';
  }
}
