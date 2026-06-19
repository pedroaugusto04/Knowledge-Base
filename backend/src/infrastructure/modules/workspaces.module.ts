import { Module } from '@nestjs/common';
import { LoggerModule } from './logger.module.js';
import { DatabaseModule } from './database.module.js';
import { AuthModule } from './auth.module.js';
import { EnvModule } from './env.module.js';
import { AiModule } from './ai.module.js';

import {
  ListWorkspacesUseCase,
  CreateWorkspaceUseCase,
  ListWorkspaceRepositoriesUseCase,
  ListWorkspaceCategoriesUseCase,
} from '../../application/use-cases/index.js';
import { GithubRepositoryResolutionService } from '../../application/services/github-repository-resolution.service.js';
import { WorkspacesController } from '../../interfaces/http/controllers/index.js';

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    EnvModule,
    AiModule,
  ],
  controllers: [
    WorkspacesController,
  ],
  providers: [
    ListWorkspacesUseCase,
    CreateWorkspaceUseCase,
    ListWorkspaceRepositoriesUseCase,
    ListWorkspaceCategoriesUseCase,
    GithubRepositoryResolutionService,
  ],
  exports: [
    ListWorkspacesUseCase,
    CreateWorkspaceUseCase,
    ListWorkspaceRepositoriesUseCase,
    ListWorkspaceCategoriesUseCase,
    GithubRepositoryResolutionService,
  ],
})
export class WorkspacesModule {}
