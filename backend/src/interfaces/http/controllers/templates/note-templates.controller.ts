import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../../../application/auth.js';
import {
  CreateNoteTemplateUseCase,
  ListNoteTemplatesUseCase,
  UpdateNoteTemplateUseCase,
  DeleteNoteTemplateUseCase,
  ApplyNoteTemplateUseCase,
} from '../../../../application/use-cases/index.js';
import { CurrentUser } from '../../auth.decorators.js';
import { AccessTokenAuthGuard, TrustedOriginGuard } from '../../auth.guards.js';
import {
  createNoteTemplateBodySchema,
  updateNoteTemplateBodySchema,
  noteTemplateIdParamSchema,
  applyNoteTemplateBodySchema,
  listNoteTemplatesQuerySchema,
  type CreateNoteTemplateBody,
  type UpdateNoteTemplateBody,
  type NoteTemplateIdParam,
  type ApplyNoteTemplateBody,
  type ListNoteTemplatesQuery,
} from '../../dto/note-template.dto.js';
import { ZodValidationPipe } from '../../zod-validation.pipe.js';

@ApiTags('Note Templates')
@Controller('api/note-templates')
@UseGuards(AccessTokenAuthGuard)
export class NoteTemplatesController {
  constructor(
    private readonly createNoteTemplate: CreateNoteTemplateUseCase,
    private readonly listNoteTemplates: ListNoteTemplatesUseCase,
    private readonly updateNoteTemplate: UpdateNoteTemplateUseCase,
    private readonly deleteNoteTemplate: DeleteNoteTemplateUseCase,
    private readonly applyNoteTemplate: ApplyNoteTemplateUseCase,
  ) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a note template' })
  @ApiResponse({ status: 201, description: 'Note template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  create(
    @Body(new ZodValidationPipe(createNoteTemplateBodySchema, 'invalid_create_note_template_payload')) body: CreateNoteTemplateBody & { workspaceSlug: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createNoteTemplate.execute(body);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List note templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'workspaceSlug', required: false })
  @ApiResponse({ status: 200, description: 'Note templates listed successfully' })
  list(
    @Query(new ZodValidationPipe(listNoteTemplatesQuerySchema, 'invalid_list_query')) query: ListNoteTemplatesQuery & { workspaceSlug: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listNoteTemplates.execute(query);
  }

  @Patch(':id')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a note template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Note template updated successfully' })
  @ApiResponse({ status: 404, description: 'Note template not found' })
  update(
    @Param(new ZodValidationPipe(noteTemplateIdParamSchema, 'invalid_template_id')) params: NoteTemplateIdParam,
    @Body(new ZodValidationPipe(updateNoteTemplateBodySchema, 'invalid_update_note_template_payload')) body: UpdateNoteTemplateBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateNoteTemplate.execute({
      ...body,
      id: params.id,
    });
  }

  @Delete(':id')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a note template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Note template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note template not found' })
  remove(
    @Param(new ZodValidationPipe(noteTemplateIdParamSchema, 'invalid_template_id')) params: NoteTemplateIdParam,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deleteNoteTemplate.execute(params.id);
  }

  @Post('apply')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a note template to create a note' })
  @ApiResponse({ status: 200, description: 'Note template applied successfully' })
  @ApiResponse({ status: 404, description: 'Note template not found' })
  apply(
    @Body(new ZodValidationPipe(applyNoteTemplateBodySchema, 'invalid_apply_note_template_payload')) body: ApplyNoteTemplateBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyNoteTemplate.execute(body);
  }
}
