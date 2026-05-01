export type ProjectRepository = {
  externalRepoId: string;
  repoFullName: string;
};

export type Project = {
  projectSlug: string;
  displayName: string;
  workspaceSlug: string;
  repositories: ProjectRepository[];
  aliases: string[];
  defaultTags: string[];
  enabled: boolean;
};
