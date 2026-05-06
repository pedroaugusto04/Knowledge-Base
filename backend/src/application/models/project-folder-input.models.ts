export type CreateProjectFolderInput = {
  projectSlug: string;
  displayName: string;
  parentFolderId?: string;
};

export type UpdateProjectFolderInput = {
  projectSlug: string;
  folderId: string;
  displayName: string;
  parentFolderId?: string;
};
