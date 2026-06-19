import crypto from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import type {
  CreateNoteTemplateInput,
  NoteTemplate,
  UpdateNoteTemplateInput,
} from '../../application/models/note-template.models.js';
import { buildPaginationMeta, type PaginatedResult } from '../../contracts/pagination.js';
import { NoteTemplateRepository } from '../../application/ports/templates/note-template.repository.js';
import { PostgresDatabase } from '../persistence/database.js';
import { noteTemplates } from '../persistence/schema/index.js';

@Injectable()
export class PostgresNoteTemplateRepository implements NoteTemplateRepository {
  constructor(private readonly database: PostgresDatabase) {}

  async create(input: CreateNoteTemplateInput): Promise<NoteTemplate> {
    const db = this.database.getDb();
    const result = await db
      .insert(noteTemplates)
      .values({
        id: crypto.randomUUID(),
        workspaceSlug: input.workspaceSlug,
        name: input.name,
        description: input.description,
        canonicalType: input.canonicalType,
        defaultTags: input.defaultTags,
        defaultStatus: input.defaultStatus,
        sections: input.sections.map((section, index) => ({
          id: crypto.randomUUID(),
          ...section,
          order: section.order,
        })),
        isDefault: input.isDefault || false,
      })
      .returning();

    return this.mapFromRow(result[0]);
  }

  async findById(id: string): Promise<NoteTemplate | null> {
    const db = this.database.getDb();
    const result = await db
      .select()
      .from(noteTemplates)
      .where(eq(noteTemplates.id, id))
      .limit(1);

    return result[0] ? this.mapFromRow(result[0]) : null;
  }

  async findByWorkspace(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResult<NoteTemplate>> {
    const db = this.database.getDb();
    
    const totalResult = await db
      .select({ count: noteTemplates.id })
      .from(noteTemplates)
      .where(eq(noteTemplates.workspaceSlug, input.workspaceSlug));
    
    const total = totalResult.length;
    const pagination = buildPaginationMeta(
      { page: input.page, pageSize: input.pageSize },
      total
    );
    
    const offset = (pagination.page - 1) * pagination.pageSize;
    const result = await db
      .select()
      .from(noteTemplates)
      .where(eq(noteTemplates.workspaceSlug, input.workspaceSlug))
      .orderBy(desc(noteTemplates.isDefault), noteTemplates.name)
      .limit(pagination.pageSize)
      .offset(offset);

    return {
      items: result.map((row) => this.mapFromRow(row)),
      pagination,
    };
  }

  async update(input: UpdateNoteTemplateInput): Promise<NoteTemplate> {
    const db = this.database.getDb();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.canonicalType !== undefined) updateData.canonicalType = input.canonicalType;
    if (input.defaultTags !== undefined) updateData.defaultTags = input.defaultTags;
    if (input.defaultStatus !== undefined) updateData.defaultStatus = input.defaultStatus;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
    if (input.sections !== undefined) {
      updateData.sections = input.sections.map((section, index) => ({
        id: crypto.randomUUID(),
        ...section,
        order: section.order,
      }));
    }

    const result = await db
      .update(noteTemplates)
      .set(updateData)
      .where(eq(noteTemplates.id, input.id))
      .returning();

    if (!result[0]) {
      throw new Error('Note template not found');
    }

    return this.mapFromRow(result[0]);
  }

  async delete(id: string): Promise<void> {
    const db = this.database.getDb();
    await db.delete(noteTemplates).where(eq(noteTemplates.id, id));
  }

  async findDefault(input: {
    workspaceSlug: string;
    canonicalType?: string;
  }): Promise<NoteTemplate | null> {
    const db = this.database.getDb();
    
    const conditions = [eq(noteTemplates.workspaceSlug, input.workspaceSlug)];
    if (input.canonicalType) {
      conditions.push(eq(noteTemplates.canonicalType, input.canonicalType));
    }
    
    const result = await db
      .select()
      .from(noteTemplates)
      .where(and(...conditions, eq(noteTemplates.isDefault, true)))
      .limit(1);

    return result[0] ? this.mapFromRow(result[0]) : null;
  }

  private mapFromRow(row: any): NoteTemplate {
    return {
      id: row.id,
      workspaceSlug: row.workspaceSlug,
      name: row.name,
      description: row.description,
      canonicalType: row.canonicalType,
      defaultTags: row.defaultTags || [],
      defaultStatus: row.defaultStatus,
      sections: row.sections || [],
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
