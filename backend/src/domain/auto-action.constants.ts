export const AUTO_ACTION_NONE = 'none' as const;
export const AUTO_ACTION_RESOLVED = 'resolved' as const;
export const AUTO_ACTION_ARCHIVED = 'archived' as const;

export type AutoAction = typeof AUTO_ACTION_NONE | typeof AUTO_ACTION_RESOLVED | typeof AUTO_ACTION_ARCHIVED;
