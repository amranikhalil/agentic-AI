import { STAGE_META, type StageState } from '../../types';

interface Props {
  text: string;
  stageState: StageState;
}

export function SearchStage({ text, stageState }: Props) {
  const streaming = stageState === 'running';
  if (text) {
    return (
      <pre className="pl__pre">
        {text}
        {streaming && <span className="pl__cursor" />}
      </pre>
    );
  }
  return (
    <div className="pl__empty">
      <div className="pl__emptyLabel">{STAGE_META.search.name}</div>
      <div className="pl__emptyDesc">
        {stageState === 'running' ? 'Query agent is warming up…' : STAGE_META.search.role}
      </div>
    </div>
  );
}