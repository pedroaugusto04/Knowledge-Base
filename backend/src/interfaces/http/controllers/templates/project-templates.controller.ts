import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../../../application/auth.js';
import {
  CreateProjectTemplateUseCase,
  ListProjectTemplatesUseCase,
  UpdateProjectTemplateUseCase,
  DeleteProjectTemplateUseCase,
  ApplyProjectTemplateUseCase,
} from '../../../../application/use-cases/index.js';
import { CurrentUser } from '../../auth.decorators.js';
import { AccessTokenAuthGuard, TrustedOriginGuard } from '../../auth.guards.js';
import {
  createProjectTemplateBodySchema,
  updateProjectTemplateBodySchema,
  projectTemplateIdParamSchema,
  applyProjectTemplateBodySchema,
  listProjectTemplatesQuerySchema,
  type CreateProjectTemplateBody,
  type UpdateProjectTemplateBody,
  type ProjectTemplateIdParam,
  type ApplyProjectTemplateBody,
  type ListProjectTemplatesQuery,
} from '../../dto/project-template.dto.js';
import { ZodValidationPipe } from '../../zod-validation.pipe.js';

@ApiTags('Project Templates')
@Controller('api/project-templates')
@UseGuards(AccessTokenAuthGuard)
export class ProjectTemplatesController {
  constructor(
    private readonly createProjectTemplate: CreateProjectTemplateUseCase,
    private readonly listProjectTemplates: ListProjectTemplatesUseCase,
    private readonly updateProjectTemplate: UpdateProjectTemplateUseCase,
    private readonly deleteProjectTemplate: DeleteProjectTemplateUseCase,
    private readonly applyProjectTemplate: ApplyProjectTemplateUseCase,
  ) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a project template' })
  @ApiResponse({ status: 201, description: 'Project template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  create(
    @Body(new ZodValidationPipe(createProjectTemplateBodySchema, 'invalid_create_project_template_payload')) body: CreateProjectTemplateBody & { workspaceSlug: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createProjectTemplate.execute(body);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List project templates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'workspaceSlug', required: false })
  @ApiResponse({ status: 200, description: 'Project templates listed successfully' })
  list(
    @Query(new ZodValidationPipe(listProjectTemplatesQuerySchema, 'invalid_list_query')) query: ListProjectTemplatesQuery & { workspaceSlug: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listProjectTemplates.execute(query);
  }

  @Patch(':id')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Project template updated successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  update(
    @Param(new ZodValidationPipe(projectTemplateIdParamSchema, 'invalid_template_id')) params: ProjectTemplateIdParam,
    @Body(new ZodValidationPipe(updateProjectTemplateBodySchema, 'invalid_update_project_template_payload')) body: UpdateProjectTemplateBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateProjectTemplate.execute({
      ...body,
      id: params.id,
    });
  }

  @Delete(':id')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Project template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  remove(
    @Param(new ZodValidationPipe(projectTemplateIdParamSchema, 'invalid_template_id')) params: ProjectTemplateIdParam,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deleteProjectTemplate.execute(params.id);
  }

  @Post('apply')
  @UseGuards(TrustedOriginGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a project template to create a project' })
  @ApiResponse({ status: 200, description: 'Project template applied successfully' })
  @ApiResponse({ status: 404, description: 'Project template not found' })
  apply(
    @Body(new ZodValidationPipe(applyProjectTemplateBodySchema, 'invalid_apply_project_template_payload')) body: ApplyProjectTemplateBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyProjectTemplate.execute(body);
  }
}
