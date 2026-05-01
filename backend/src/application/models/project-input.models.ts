export type ProjectRepositoryInput = {
  externalRepoId: string;
  repoFullName: string;
};

export type CreateProjectInput = {
  displayName: string;
  projectSlug: string;
  repositories: ProjectRepositoryInput[];
  aliases: string[];
  defaultTags: string[];
};

export type UpdateProjectInput = {
  projectSlug: string;
  displayName: string;
  repositories: ProjectRepositoryInput[];
  aliases: string[];
  defaultTags: string[];
};
