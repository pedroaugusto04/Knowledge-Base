import { Module } from '@nestjs/common';
import { LoggerModule } from './logger.module.js';
import { EnvModule } from './env.module.js';
import { DatabaseModule } from './database.module.js';

import {
  CreateNoteTemplateUseCase,
  ListNoteTemplatesUseCase,
  UpdateNoteTemplateUseCase,
  DeleteNoteTemplateUseCase,
  ApplyNoteTemplateUseCase,
  CreateProjectTemplateUseCase,
  ListProjectTemplatesUseCase,
  UpdateProjectTemplateUseCase,
  DeleteProjectTemplateUseCase,
  ApplyProjectTemplateUseCase,
} from '../../application/use-cases/index.js';
import { PostgresNoteTemplateRepository } from '../../infrastructure/repositories/note-template.repository.js';
import { PostgresProjectTemplateRepository } from '../../infrastructure/repositories/project-template.repository.js';
import { NoteTemplatesController } from '../../interfaces/http/controllers/templates/note-templates.controller.js';
import { ProjectTemplatesController } from '../../interfaces/http/controllers/templates/project-templates.controller.js';

@Module({
  imports: [
    LoggerModule,
    EnvModule,
    DatabaseModule,
  ],
  controllers: [
    NoteTemplatesController,
    ProjectTemplatesController,
  ],
  providers: [
    PostgresNoteTemplateRepository,
    PostgresProjectTemplateRepository,
    CreateNoteTemplateUseCase,
    ListNoteTemplatesUseCase,
    UpdateNoteTemplateUseCase,
    DeleteNoteTemplateUseCase,
    ApplyNoteTemplateUseCase,
    CreateProjectTemplateUseCase,
    ListProjectTemplatesUseCase,
    UpdateProjectTemplateUseCase,
    DeleteProjectTemplateUseCase,
    ApplyProjectTemplateUseCase,
  ],
  exports: [
    PostgresNoteTemplateRepository,
    PostgresProjectTemplateRepository,
    CreateNoteTemplateUseCase,
    ListNoteTemplatesUseCase,
    UpdateNoteTemplateUseCase,
    DeleteNoteTemplateUseCase,
    ApplyNoteTemplateUseCase,
    CreateProjectTemplateUseCase,
    ListProjectTemplatesUseCase,
    UpdateProjectTemplateUseCase,
    DeleteProjectTemplateUseCase,
    ApplyProjectTemplateUseCase,
  ],
})
export class TemplatesModule {}
