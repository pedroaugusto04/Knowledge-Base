export type Workspace = {
  workspaceSlug: string;
  displayName: string;
};

export type CreateWorkspaceResponse = {
  ok: true;
  workspace: Workspace;
  initialProject: {
    projectSlug: string;
    displayName: string;
    repositories: { externalRepoId: string; repoFullName: string }[];
    workspaceSlug: string;
    aliases: string[];
    defaultTags: string[];
    enabled: boolean;
  };
};
