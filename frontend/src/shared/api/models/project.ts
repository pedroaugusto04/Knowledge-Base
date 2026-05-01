export type ProjectRepository = {
  externalRepoId: string;
  repoFullName: string;
};

export type Project = {
  projectSlug: string;
  displayName: string;
  repositories: ProjectRepository[];
  workspaceSlug: string;
  aliases: string[];
  defaultTags: string[];
  enabled: boolean;
};
