import { useEffect, useRef } from 'react';
import { STAGE_META, type StageId, type StageState } from '../types';
import { StageContent, type StageData } from './StageContent';

interface Props {
  stageId: StageId;
  stageState: StageState;
  data: StageData;
  autoSwitchKey?: unknown;
}

export function FocusPane({ stageId, stageState, data, autoSwitchKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [stageId, data, stageState, autoSwitchKey]);

  const streaming = stageState === 'running';

  return (
    <div className={`pl__focus ${streaming ? 'pl__focus--active' : ''}`}>
      <div className="pl__focusHeader">
        <span className="pl__focusTitle">{STAGE_META[stageId].name}</span>
        {streaming && (
          <span className="pl__streamTag">
            <span className="pl__streamDot" />
            streaming
          </span>
        )}
      </div>
      <div className="pl__focusBody" ref={ref}>
        <StageContent stageId={stageId} stageState={stageState} data={data} />
      </div>
    </div>
  );
}