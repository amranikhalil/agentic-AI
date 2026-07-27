import { useState } from 'react';
import './App.css';
import { usePipeline } from './hooks/usePipeline';
import { StageList } from './components/StageList';
import { FocusPane } from './components/FocusPane';
import type { StageId } from './types';

export default function App() {
  const p = usePipeline();

  // focusStage follows the active streaming stage by default; clicking a row
  // pins focus on that stage until the next stage transition clears the pin.
  // (Adjusting state during render is the React-recommended alternative to
  //  useEffect for prop-driven state resets — avoids cascading renders.)
  const [prevActive, setPrevActive] = useState<StageId>(p.activeStage);
  const [userFocus, setUserFocus] = useState<StageId | null>(null);
  if (p.activeStage !== prevActive) {
    setPrevActive(p.activeStage);
    setUserFocus(null);
  }
  const focusStage = userFocus ?? p.activeStage;

  return (
    <div className="pl">
      {/* Top bar */}
      <div className="pl__topbar">
        <span className="pl__brand">
          multi-agent <span className="pl__brandDim">pipeline</span>
        </span>
        <span className="pl__brandDim">│ ollama qwen3.5</span>
        <div className="pl__prompt">
          <input
            className="pl__input"
            type="text"
            value={p.prompt}
            onChange={(e) => p.setPrompt(e.target.value)}
            placeholder="prompt…"
            disabled={p.isRunning}
          />
          <button className="pl__run" onClick={p.start} disabled={p.isRunning}>
            {p.isRunning ? 'running' : 'run'}
          </button>
        </div>
        <span className="pl__status">{p.isRunning ? 'live' : 'idle'}</span>
      </div>

      {/* Body: status list + focus pane */}
      <div className="pl__body">
        <StageList
          stages={p.stages}
          activeStage={p.activeStage}
          focusStage={focusStage}
          onSelect={setUserFocus}
        />
        <FocusPane
          stageId={focusStage}
          stageState={p.stages[focusStage].state}
          data={{
            searchOutput: p.searchOutput,
            researchOutput: p.researchOutput,
            writeOutput: p.writeOutput,
            searchResults: p.searchResults,
            queries: p.queries,
          }}
        />
      </div>
    </div>
  );
}