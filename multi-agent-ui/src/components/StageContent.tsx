import type { SearchResult, StageId, StageState } from '../types';
import { SearchStage } from './stages/SearchStage';
import { SourcesStage } from './stages/SourcesStage';
import { ResearchStage } from './stages/ResearchStage';
import { WriteStage } from './stages/WriteStage';

export interface StageData {
  searchOutput: string;
  researchOutput: string;
  writeOutput: string;
  searchResults: SearchResult[];
  queries: string[];
}

interface Props {
  stageId: StageId;
  stageState: StageState;
  data: StageData;
}

export function StageContent({ stageId, stageState, data }: Props) {
  switch (stageId) {
    case 'search':
      return <SearchStage text={data.searchOutput} stageState={stageState} />;
    case 'sources':
      return (
        <SourcesStage results={data.searchResults} queries={data.queries} stageState={stageState} />
      );
    case 'research':
      return <ResearchStage text={data.researchOutput} stageState={stageState} />;
    case 'write':
      return <WriteStage text={data.writeOutput} stageState={stageState} />;
  }
}