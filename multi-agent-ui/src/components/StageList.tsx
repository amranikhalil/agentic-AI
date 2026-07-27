import { STAGE_META, STAGE_ORDER, type Stage, type StageId } from '../types';

interface Props {
  stages: Record<StageId, Stage>;
  activeStage: StageId;
  focusStage: StageId;
  onSelect: (id: StageId) => void;
}

function RowIcon({ state }: { state: Stage['state'] }) {
  if (state === 'done') return <span>✓</span>;
  if (state === 'error') return <span>✗</span>;
  if (state === 'running') return <span className="pl__spinner">◐</span>;
  return <span>○</span>;
}

export function StageList({ stages, activeStage, focusStage, onSelect }: Props) {
  return (
    <div className="pl__list">
      <div className="pl__listHeader">stages</div>
      {STAGE_ORDER.map((id) => {
        const s = stages[id];
        const isActiveStream = id === activeStage && s.state === 'running';
        const isFocused = id === focusStage;
        const cls = [
          'pl__row',
          isActiveStream ? 'pl__row--active' : '',
          s.state === 'idle' ? 'pl__row--idle' : '',
          s.state === 'done' ? 'pl__row--done' : '',
          s.state === 'error' ? 'pl__row--error' : '',
          isFocused ? 'pl__row--focused' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={id}
            type="button"
            className={cls}
            onClick={() => onSelect(id)}
            title={`Focus ${STAGE_META[id].name}`}
          >
            <span className="pl__rowIcon">
              <RowIcon state={s.state} />
            </span>
            <div className="pl__rowBody">
              <span className="pl__rowName">{STAGE_META[id].name}</span>
              <span className="pl__rowSummary">{s.summary}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}