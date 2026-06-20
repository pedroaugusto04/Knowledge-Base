export type NoteNeighbor = {
  id: string;
  title: string;
};

export type NoteNeighbors = {
  previous: NoteNeighbor | null;
  next: NoteNeighbor | null;
};

export type GetNoteNeighborsInput = {
  projectId?: string;
  projectSlug?: string;
  status?: string;
};
