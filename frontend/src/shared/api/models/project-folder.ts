export type ProjectFolder = {
  id: string;
  projectSlug: string;
  workspaceSlug: string;
  parentFolderId: string | null;
  displayName: string;
  folderSlug: string;
  fullSlugPath: string;
  children: ProjectFolder[];
};
