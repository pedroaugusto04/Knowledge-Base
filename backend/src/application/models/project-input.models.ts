export type CreateProjectInput = {
  displayName: string;
  projectSlug: string;
  repositoryIds: string[];
  defaultTags: string[];
};

export type UpdateProjectInput = {
  projectId: string;
  displayName: string;
  repositoryIds: string[];
  defaultTags: string[];
};
