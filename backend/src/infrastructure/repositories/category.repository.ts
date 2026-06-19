import crypto from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import type { CategoryRecord } from '../../application/models/repository-records.models.js';
import { categoryFromRow } from '../mappers/row.mappers.js';
import { PostgresDatabase } from '../persistence/database.js';
import { categories, workspaces } from '../persistence/schema/index.js';

@Injectable()
export class PostgresCategoryRepository {
  constructor(private readonly database: PostgresDatabase) {}

  async list(userId: string, workspaceSlug: string): Promise<CategoryRecord[]> {
    const db = this.database.getDb();
    const result = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        workspaceId: categories.workspaceId,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
        isSystem: categories.isSystem,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .innerJoin(workspaces, and(eq(workspaces.id, categories.workspaceId), eq(workspaces.userId, userId)))
      .where(and(eq(categories.userId, userId), eq(workspaces.workspaceSlug, workspaceSlug)))
      .orderBy(categories.name);

    return result.map(categoryFromRow);
  }

  async getById(userId: string, categoryId: string): Promise<CategoryRecord | null> {
    const db = this.database.getDb();
    const result = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        workspaceId: categories.workspaceId,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
        isSystem: categories.isSystem,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
      .limit(1);

    return result[0] ? categoryFromRow(result[0]) : null;
  }

  async create(
    userId: string,
    workspaceSlug: string,
    input: { name: string; color?: string; icon?: string; isSystem?: boolean }
  ): Promise<CategoryRecord> {
    const db = this.database.getDb();
    const workspaceResult = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.userId, userId), eq(workspaces.workspaceSlug, workspaceSlug)))
      .limit(1);

    if (workspaceResult.length === 0) {
      throw new Error(`Workspace not found: ${workspaceSlug}`);
    }
    const workspaceId = workspaceResult[0].id;

    const result = await db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        userId,
        workspaceId,
        name: input.name,
        color: input.color || '#9e9e9e',
        icon: input.icon || '',
        isSystem: input.isSystem || false,
      })
      .returning();

    return categoryFromRow(result[0]);
  }

  async findByName(userId: string, workspaceSlug: string, name: string): Promise<CategoryRecord | null> {
    const db = this.database.getDb();
    const result = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        workspaceId: categories.workspaceId,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
        isSystem: categories.isSystem,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .innerJoin(workspaces, and(eq(workspaces.id, categories.workspaceId), eq(workspaces.userId, userId)))
      .where(and(
        eq(categories.userId, userId),
        eq(workspaces.workspaceSlug, workspaceSlug),
        eq(categories.name, name)
      ))
      .limit(1);

    return result[0] ? categoryFromRow(result[0]) : null;
  }
}
