import crypto from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';

import type {
  CreateProjectTemplateInput,
  ProjectTemplate,
  UpdateProjectTemplateInput,
} from '../../application/models/project-template.models.js';
import { buildPaginationMeta, type PaginatedResult } from '../../contracts/pagination.js';
import { ProjectTemplateRepository } from '../../application/ports/templates/project-template.repository.js';
import { PostgresDatabase } from '../persistence/database.js';
import { projectTemplates } from '../persistence/schema/index.js';

@Injectable()
export class PostgresProjectTemplateRepository implements ProjectTemplateRepository {
  constructor(private readonly database: PostgresDatabase) {}

  async create(input: CreateProjectTemplateInput): Promise<ProjectTemplate> {
    const db = this.database.getDb();
    const result = await db
      .insert(projectTemplates)
      .values({
        id: crypto.randomUUID(),
        workspaceSlug: input.workspaceSlug,
        name: input.name,
        description: input.description,
        fields: input.fields.map((field, index) => ({
          id: crypto.randomUUID(),
          ...field,
          order: field.order,
        })),
        folders: input.folders.map((folder, index) => ({
          id: crypto.randomUUID(),
          ...folder,
          order: folder.order,
        })),
        defaultTags: input.defaultTags,
        isDefault: input.isDefault || false,
      })
      .returning();

    return this.mapFromRow(result[0]);
  }

  async findById(id: string): Promise<ProjectTemplate | null> {
    const db = this.database.getDb();
    const result = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, id))
      .limit(1);

    return result[0] ? this.mapFromRow(result[0]) : null;
  }

  async findByWorkspace(input: {
    workspaceSlug: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedResult<ProjectTemplate>> {
    const db = this.database.getDb();
    
    const totalResult = await db
      .select({ count: projectTemplates.id })
      .from(projectTemplates)
      .where(eq(projectTemplates.workspaceSlug, input.workspaceSlug));
    
    const total = totalResult.length;
    const pagination = buildPaginationMeta(
      { page: input.page, pageSize: input.pageSize },
      total
    );
    
    const offset = (pagination.page - 1) * pagination.pageSize;
    const result = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.workspaceSlug, input.workspaceSlug))
      .orderBy(desc(projectTemplates.isDefault), projectTemplates.name)
      .limit(pagination.pageSize)
      .offset(offset);

    return {
      items: result.map((row) => this.mapFromRow(row)),
      pagination,
    };
  }

  async update(input: UpdateProjectTemplateInput): Promise<ProjectTemplate> {
    const db = this.database.getDb();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.defaultTags !== undefined) updateData.defaultTags = input.defaultTags;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
    if (input.fields !== undefined) {
      updateData.fields = input.fields.map((field, index) => ({
        id: crypto.randomUUID(),
        ...field,
        order: field.order,
      }));
    }
    if (input.folders !== undefined) {
      updateData.folders = input.folders.map((folder, index) => ({
        id: crypto.randomUUID(),
        ...folder,
        order: folder.order,
      }));
    }

    const result = await db
      .update(projectTemplates)
      .set(updateData)
      .where(eq(projectTemplates.id, input.id))
      .returning();

    if (!result[0]) {
      throw new Error('Project template not found');
    }

    return this.mapFromRow(result[0]);
  }

  async delete(id: string): Promise<void> {
    const db = this.database.getDb();
    await db.delete(projectTemplates).where(eq(projectTemplates.id, id));
  }

  async findDefault(input: {
    workspaceSlug: string;
  }): Promise<ProjectTemplate | null> {
    const db = this.database.getDb();
    
    const result = await db
      .select()
      .from(projectTemplates)
      .where(and(
        eq(projectTemplates.workspaceSlug, input.workspaceSlug),
        eq(projectTemplates.isDefault, true)
      ))
      .limit(1);

    return result[0] ? this.mapFromRow(result[0]) : null;
  }

  private mapFromRow(row: any): ProjectTemplate {
    return {
      id: row.id,
      workspaceSlug: row.workspaceSlug,
      name: row.name,
      description: row.description,
      fields: row.fields || [],
      folders: row.folders || [],
      defaultTags: row.defaultTags || [],
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
