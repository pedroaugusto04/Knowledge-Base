import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CanonicalType } from '../../../contracts/enums.js';
import { withDerivedReminderAt, type IngestPayload } from '../../../contracts/ingest.js';
import { buildNotePaths, renderEventNote } from '../../../domain/notes.js';
import type { Project } from '../../../domain/projects.js';
import { trimText } from '../../../domain/strings.js';
import type { NoteRecord } from '../../models/repository-records.models.js';
import type { UpdateManualNoteInput } from '../../models/note-input.models.js';
import { ContentRepository } from '../../ports/content.repository.js';
import { isManualEventNote, requireEditableManualNoteRawText, buildManualNotePayload } from './manual-note.helpers.js';

@Injectable()
export class UpdateManualNoteUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(input: UpdateManualNoteInput, userId: string) {
    const { note, project } = await this.loadEditableManualNote(userId, input.id);
    const { payload, paths, title } = this.buildUpdatePayload(note, project, input);
    const updatedEvent = await this.persistManualEvent(userId, note, project, payload, paths, title, input.rawText);
    return { ok: true as const, noteId: updatedEvent.id };
  }

  private async loadEditableManualNote(userId: string, noteId: string) {
    const note = await this.contentRepository.getNoteById(userId, noteId);
    if (!note) throw new NotFoundException('note_not_found');
    if (!isManualEventNote(note)) throw new BadRequestException('note_not_editable');

    const project = await this.contentRepository.getProjectBySlug(userId, note.projectSlug);
    if (!project || !project.enabled) throw new NotFoundException('project_not_found');

    requireEditableManualNoteRawText(note);
    return { note, project };
  }

  private buildUpdatePayload(note: NoteRecord, project: Project, input: UpdateManualNoteInput) {
    const payload = withDerivedReminderAt(buildManualNotePayload(note, project, input));
    return {
      payload,
      paths: buildNotePaths(project, payload),
      title: trimText(input.title, input.rawText),
    };
  }

  private async persistManualEvent(
    userId: string,
    note: NoteRecord,
    project: Project,
    payload: IngestPayload,
    paths: ReturnType<typeof buildNotePaths>,
    title: string,
    rawText: string,
  ) {
    return this.contentRepository.upsertNote(userId, {
      ...note,
      title,
      tags: payload.classification.tags,
      summary: payload.content.sections.summary || rawText,
      markdown: renderEventNote(project, payload, paths),
      frontmatter: {
        ...note.frontmatter,
        type: CanonicalType.Event,
        workspace: note.workspaceSlug,
        source_channel: note.sourceChannel,
        event_type: payload.event.type,
        project: project.projectSlug,
        status: note.status,
        tags: payload.classification.tags,
        occurred_at: note.occurredAt,
      },
      metadata: {
        ...note.metadata,
        manual: true,
        rawText,
        eventType: payload.event.type,
        impact: '',
        reviewFindings: [],
        reminderDate: payload.actions.reminderDate,
        reminderTime: payload.actions.reminderTime,
        reminderAt: payload.actions.reminderAt,
      },
      links: [],
    });
  }
}
