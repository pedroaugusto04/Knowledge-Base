import crypto from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import { calculateAttachmentSize } from '../../domain/strings.js';
import type { AttachmentRecord, SaveAttachmentInput } from '../../application/models/repository-records.models.js';
import { ContentObjectStorageService } from '../../application/services/content-object-storage.service.js';
import { attachmentFromRow } from '../mappers/row.mappers.js';
import { PostgresDatabase } from '../persistence/database.js';
import { attachments, notes, workspaces } from '../persistence/schema/index.js';
import { QuotaService } from '../../application/services/quota.service.js';
import { QuotaResourceType } from '../../domain/enums/plans.enums.js';
import { QuotaExceededException } from '../../interfaces/http/quota-exceeded.exception.js';

@Injectable()
export class PostgresAttachmentRepository {
  constructor(
    private readonly database: PostgresDatabase,
    private readonly contentObjectStorage: ContentObjectStorageService,
    private readonly quotaService: QuotaService,
  ) {}

  async save(userId: string, input: SaveAttachmentInput) {
    const attachmentId = input.id || crypto.randomUUID();
    const sizeBytes = calculateAttachmentSize(input.sizeBytes, input.dataBase64);

    const quotaResult = await this.quotaService.checkQuota(userId, QuotaResourceType.STORAGE, sizeBytes);
    if (!quotaResult.allowed) {
      throw new QuotaExceededException('storage', quotaResult.limit, quotaResult.current);
    }

    const db = this.database.getDb();
    const noteResult = await db
      .select({ workspaceSlug: workspaces.workspaceSlug })
      .from(notes)
      .innerJoin(workspaces, eq(workspaces.id, notes.workspaceId))
      .where(and(eq(notes.userId, userId), eq(notes.id, input.noteId)))
      .limit(1);
    
    const workspaceSlug = noteResult[0]?.workspaceSlug || 'default';
    const storageKey = await this.contentObjectStorage.saveAttachmentData(userId, workspaceSlug, input);
    const result = await db
      .insert(attachments)
      .values({
        id: attachmentId,
        userId,
        noteId: input.noteId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes,
        storageKey,
        checksumSha256: input.checksumSha256,
      })
      .returning();
    
    return attachmentFromRow(result[0]);
  }

  async list(userId: string, noteId: string) {
    const db = this.database.getDb();
    const result = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.userId, userId), eq(attachments.noteId, noteId)))
      .orderBy(desc(attachments.createdAt));
    
    return result.map(attachmentFromRow);
  }

  async listByNoteId(userId: string, noteId: string) {
    const db = this.database.getDb();
    const result = await db
      .select({ storageKey: attachments.storageKey })
      .from(attachments)
      .where(and(eq(attachments.userId, userId), eq(attachments.noteId, noteId)));
    
    return result.map((row) => row.storageKey || '');
  }

  async deleteByNoteId(userId: string, noteId: string) {
    const db = this.database.getDb();
    const result = await db
      .select({ storageKey: attachments.storageKey })
      .from(attachments)
      .where(and(eq(attachments.userId, userId), eq(attachments.noteId, noteId)));
    
    const keys = result.map((row) => row.storageKey || '');
    await db
      .delete(attachments)
      .where(and(eq(attachments.userId, userId), eq(attachments.noteId, noteId)));
    
    await this.contentObjectStorage.deleteObjects(keys);
  }
}
