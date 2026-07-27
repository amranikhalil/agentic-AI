export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export type StageId = 'search' | 'sources' | 'research' | 'write';
export type StageState = 'idle' | 'running' | 'done' | 'error';

export interface Stage {
  state: StageState;
  summary: string;
}

export interface StageMeta {
  name: string;
  role: string;
}

export const STAGE_META: Record<StageId, StageMeta> = {
  search: { name: 'Search', role: 'Generate search queries via the query agent.' },
  sources: { name: 'Sources', role: 'Fetch SERP results. Compact list of fetched sources.' },
  research: { name: 'Research', role: 'Researcher distills results into concise notes.' },
  write: { name: 'Write', role: 'Senior writer composes the final markdown report.' },
};

export const STAGE_ORDER: StageId[] = ['search', 'sources', 'research', 'write'];