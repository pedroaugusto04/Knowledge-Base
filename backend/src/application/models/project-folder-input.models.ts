export type CreateProjectFolderInput = {
  projectId: string;
  displayName: string;
  parentFolderId?: string;
};

export type UpdateProjectFolderInput = {
  projectId: string;
  folderId: string;
  displayName: string;
  parentFolderId?: string;
};
