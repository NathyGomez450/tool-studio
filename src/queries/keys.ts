export function queryKeys(projectId: string) {
  return {
    columns: ['columns', projectId] as const,
    bugs: ['bugs', projectId] as const,
    bugComments: (bugId: string) => ['bug-comments', projectId, bugId] as const,
    roadmap: ['roadmap', projectId] as const,
    gdd: ['gdd', projectId] as const,
    assets: ['assets', projectId] as const,
    team: ['team', projectId] as const,
    brainstorm: ['brainstorm', projectId] as const,
    brainstormEdges: ['brainstorm-edges', projectId] as const,
    noteComments: (noteId: string) => ['note-comments', projectId, noteId] as const,
    dashboard: ['dashboard', projectId] as const,
  };
}
