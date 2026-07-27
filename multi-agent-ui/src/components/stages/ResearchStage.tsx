import { STAGE_META, type StageState } from '../../types';

interface Props {
  text: string;
  stageState: StageState;
}

export function ResearchStage({ text, stageState }: Props) {
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
      <div className="pl__emptyLabel">{STAGE_META.research.name}</div>
      <div className="pl__emptyDesc">
        {stageState === 'running' ? 'Researcher is analyzing sources…' : STAGE_META.research.role}
      </div>
    </div>
  );
}