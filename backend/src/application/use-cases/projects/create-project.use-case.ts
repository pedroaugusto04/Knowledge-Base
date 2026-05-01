import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { readEnvironment } from '../../../adapters/environment.js';
import { fetchGithubInstallationRepositories } from '../../../adapters/github.js';
import { CredentialRecordStatus, IntegrationProvider } from '../../../contracts/enums.js';
import type { CreateProjectInput, UpdateProjectInput } from '../../models/project-input.models.js';
import { decryptConfig } from '../../credentials.js';
import { ContentRepository } from '../../ports/content.repository.js';
import { CredentialRepository } from '../../ports/integrations.repository.js';

function sameRepo(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

@Injectable()
export class CreateProjectUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly credentialRepository: CredentialRepository,
  ) { }

  async execute(input: CreateProjectInput, userId: string) {
    const workspaces = await this.contentRepository.listWorkspaces(userId);
    const workspace = workspaces[0];
    if (!workspace) throw new NotFoundException('workspace_not_found');

    const projects = await this.contentRepository.listProjects(userId);
    if (projects.some((project) => project.enabled && project.projectSlug === input.projectSlug)) {
      throw new ConflictException({
        code: 'project_slug_already_exists',
        details: { fieldErrors: { projectSlug: 'Este slug de projeto ja existe.' } },
      });
    }

    const selectedRepositories = await this.resolveSelectedRepositories(userId, workspace.workspaceSlug, input.repositoryIds);

    const project = await this.contentRepository.upsertProject(userId, {
      projectSlug: input.projectSlug,
      displayName: input.displayName,
      workspaceSlug: workspace.workspaceSlug,
      repositories: selectedRepositories,
      aliases: input.aliases,
      defaultTags: input.defaultTags,
      enabled: true,
    });

    return {
      ok: true as const,
      project,
      workspace,
    };
  }

  private async resolveSelectedRepositories(userId: string, workspaceSlug: string, repositoryIds: string[]) {
    if (repositoryIds.length === 0) return [];
    const credential = await this.credentialRepository.findCredential(userId, workspaceSlug, IntegrationProvider.GithubApp);
    if (!credential || credential.status !== CredentialRecordStatus.Connected || credential.revokedAt) {
      throw new BadRequestException({
        code: 'github_connection_required',
        details: { fieldErrors: { repositoryIds: 'Conecte o GitHub antes de vincular repositorios ao projeto.' } },
      });
    }

    const environment = readEnvironment();
    const config = decryptConfig(credential.encryptedConfig) as { installationId?: string };
    const installationId = String(config.installationId || '').trim();
    if (!environment.githubAppId || !environment.githubAppPrivateKey || !installationId) {
      throw new BadRequestException('github_app_installation_not_configured');
    }

    const availableRepositories = await fetchGithubInstallationRepositories({
      appId: environment.githubAppId,
      privateKey: environment.githubAppPrivateKey,
      installationId,
    });
    const repositoryById = new Map(availableRepositories.map((repository) => [String(repository.id), repository]));
    const missingRepositoryId = repositoryIds.find((repositoryId) => !repositoryById.has(repositoryId));
    if (missingRepositoryId) {
      throw new BadRequestException({
        code: 'invalid_project_repository_selection',
        details: { fieldErrors: { repositoryIds: 'Selecione apenas repositorios acessiveis no GitHub vinculado.' } },
      });
    }

    const uniqueRepositoryIds = [...new Set(repositoryIds)];
    return Promise.all(uniqueRepositoryIds.map(async (repositoryId) => {
      const repository = repositoryById.get(repositoryId);
      return this.contentRepository.upsertRepository({
        workspaceSlug,
        externalId: String(repository?.id || repositoryId),
        fullName: repository?.fullName || '',
        htmlUrl: repository?.htmlUrl || null,
        description: repository?.description ?? null,
        defaultBranch: repository?.defaultBranch ?? null,
      });
    }));
  }
}

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly credentialRepository: CredentialRepository,
  ) { }

  async execute(input: UpdateProjectInput, userId: string) {

    const project = await this.contentRepository.getProjectBySlug(userId, input.projectSlug);
    if (!project || !project.enabled) throw new NotFoundException('project_not_found');

    const selectedRepositories = await this.resolveSelectedRepositories(userId, project.workspaceSlug, input.repositoryIds);

    const updatedProject = await this.contentRepository.upsertProject(userId, {
      ...project,
      displayName: input.displayName,
      repositories: selectedRepositories,
      aliases: input.aliases,
      defaultTags: input.defaultTags,
    });

    return { ok: true as const, project: updatedProject };
  }

  private async resolveSelectedRepositories(userId: string, workspaceSlug: string, repositoryIds: string[]) {
    if (repositoryIds.length === 0) return [];
    const credential = await this.credentialRepository.findCredential(userId, workspaceSlug, IntegrationProvider.GithubApp);
    if (!credential || credential.status !== CredentialRecordStatus.Connected || credential.revokedAt) {
      throw new BadRequestException({
        code: 'github_connection_required',
        details: { fieldErrors: { repositoryIds: 'Conecte o GitHub antes de vincular repositorios ao projeto.' } },
      });
    }

    const environment = readEnvironment();
    const config = decryptConfig(credential.encryptedConfig) as { installationId?: string };
    const installationId = String(config.installationId || '').trim();
    if (!environment.githubAppId || !environment.githubAppPrivateKey || !installationId) {
      throw new BadRequestException('github_app_installation_not_configured');
    }

    const availableRepositories = await fetchGithubInstallationRepositories({
      appId: environment.githubAppId,
      privateKey: environment.githubAppPrivateKey,
      installationId,
    });
    const repositoryById = new Map(availableRepositories.map((repository) => [String(repository.id), repository]));
    const missingRepositoryId = repositoryIds.find((repositoryId) => !repositoryById.has(repositoryId));
    if (missingRepositoryId) {
      throw new BadRequestException({
        code: 'invalid_project_repository_selection',
        details: { fieldErrors: { repositoryIds: 'Selecione apenas repositorios acessiveis no GitHub vinculado.' } },
      });
    }

    const uniqueRepositoryIds = [...new Set(repositoryIds)];
    return Promise.all(uniqueRepositoryIds.map(async (repositoryId) => {
      const repository = repositoryById.get(repositoryId);
      return this.contentRepository.upsertRepository({
        workspaceSlug,
        externalId: String(repository?.id || repositoryId),
        fullName: repository?.fullName || '',
        htmlUrl: repository?.htmlUrl || null,
        description: repository?.description ?? null,
        defaultBranch: repository?.defaultBranch ?? null,
      });
    }));
  }
}

@Injectable()
export class DeleteProjectUseCase {
  constructor(private readonly contentRepository: ContentRepository) { }

  async execute(projectSlug: string, userId: string) {

    const project = await this.contentRepository.getProjectBySlug(userId, projectSlug);
    if (!project || !project.enabled) throw new NotFoundException('project_not_found');

    const notes = await this.contentRepository.listNotes(userId);
    if (notes.some((note) => note.projectSlug === projectSlug)) {
      throw new BadRequestException('project_has_notes');
    }

    await this.contentRepository.deleteProject(userId, projectSlug);

    const workspace = (await this.contentRepository.listWorkspaces(userId)).find((item) => item.workspaceSlug === project.workspaceSlug);

    return { ok: true as const, projectSlug, workspace };
  }
}
