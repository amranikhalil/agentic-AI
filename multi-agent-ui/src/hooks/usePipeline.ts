import { useCallback, useRef, useState } from 'react';
import type { SearchResult, Stage, StageId, StageState } from '../types';

interface PipelineState {
  prompt: string;
  isRunning: boolean;
  searchOutput: string;
  researchOutput: string;
  writeOutput: string;
  searchResults: SearchResult[];
  queries: string[];
  stages: Record<StageId, Stage>;
  activeStage: StageId;
}

const IDLE_STAGES: Record<StageId, Stage> = {
  search: { state: 'idle', summary: 'queued' },
  sources: { state: 'idle', summary: 'queued' },
  research: { state: 'idle', summary: 'queued' },
  write: { state: 'idle', summary: 'queued' },
};

const INITIAL: PipelineState = {
  prompt: 'Compare Express vs Fastify for building a REST API',
  isRunning: false,
  searchOutput: '',
  researchOutput: '',
  writeOutput: '',
  searchResults: [],
  queries: [],
  stages: IDLE_STAGES,
  activeStage: 'search',
};

const BACKEND_URL = 'http://localhost:3001';

export function usePipeline() {
  const [prompt, setPrompt] = useState(INITIAL.prompt);
  const [isRunning, setIsRunning] = useState(false);
  const [searchOutput, setSearchOutput] = useState(INITIAL.searchOutput);
  const [researchOutput, setResearchOutput] = useState(INITIAL.researchOutput);
  const [writeOutput, setWriteOutput] = useState(INITIAL.writeOutput);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(INITIAL.searchResults);
  const [queries, setQueries] = useState<string[]>(INITIAL.queries);
  const [stages, setStages] = useState<Record<StageId, Stage>>(IDLE_STAGES);
  const [activeStage, setActiveStage] = useState<StageId>(INITIAL.activeStage);

  // Restore selection hooks for点击 to override auto-advance.

  const seen = useRef({ a1: false, a2: false, results: false });
  const activeStageRef = useRef<StageId>('search');
  const resultsRef = useRef<SearchResult[]>([]);
  const researchLenRef = useRef(0);

  const patchStage = useCallback((id: StageId, state: StageState, summary: string) => {
    setStages((prev) => prev[id].state === state && prev[id].summary === summary
      ? prev
      : { ...prev, [id]: { state, summary } });
  }, []);

  const setActive = useCallback((id: StageId) => {
    activeStageRef.current = id;
    setActiveStage(id);
  }, []);

  const reset = useCallback(() => {
    setSearchOutput('');
    setResearchOutput('');
    setWriteOutput('');
    setSearchResults([]);
    setQueries([]);
    setStages(IDLE_STAGES);
    setActive('search');
    seen.current = { a1: false, a2: false, results: false };
    resultsRef.current = [];
    researchLenRef.current = 0;
  }, [setActive]);

  const start = useCallback(() => {
    reset();
    setIsRunning(true);
    patchStage('search', 'running', 'starting…');

    const encodedPrompt = encodeURIComponent(prompt);
    const eventSource = new EventSource(
      `${BACKEND_URL}/api/stream-agents?prompt=${encodedPrompt}`,
    );

    eventSource.addEventListener('agent3-token', (e: MessageEvent) => {
      const { chunk } = JSON.parse(e.data);
      setSearchOutput((prev) => {
        const next = prev + chunk;
        patchStage('search', 'running', `running · ${next.length} ch`);
        return next;
      });
    });

    eventSource.addEventListener('search-results', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const results: SearchResult[] = data.results || [];
      const qs: string[] = data.queries || [];
      resultsRef.current = results;
      setSearchResults(results);
      setQueries(qs);
      patchStage('search', 'done', `done · ${qs.length} quer${qs.length === 1 ? 'y' : 'ies'}`);
      setActive('sources');
      patchStage('sources', 'running', `running · ${results.length} sources`);
      seen.current.results = true;
    });

    eventSource.addEventListener('agent1-token', (e: MessageEvent) => {
      const { chunk } = JSON.parse(e.data);
      if (!seen.current.a1) {
        seen.current.a1 = true;
        patchStage('sources', 'done', `done · ${resultsRef.current.length} sources`);
        setActive('research');
      }
      setResearchOutput((prev) => {
        const next = prev + chunk;
        researchLenRef.current = next.length;
        patchStage('research', 'running', `running · ${next.length} ch`);
        return next;
      });
    });

    eventSource.addEventListener('agent2-token', (e: MessageEvent) => {
      const { chunk } = JSON.parse(e.data);
      if (!seen.current.a2) {
        seen.current.a2 = true;
        patchStage('research', 'done', `done · ${researchLenRef.current} ch`);
        setActive('write');
      }
      setWriteOutput((prev) => {
        const next = prev + chunk;
        patchStage('write', 'running', `running · ${next.length} ch`);
        return next;
      });
    });

    eventSource.addEventListener('done', () => {
      patchStage('write', 'done', 'done');
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      let message = 'connection error';
      try {
        const data = JSON.parse(e.data ?? '{}');
        if (data?.message) message = String(data.message).slice(0, 60);
      } catch {
        /* SSE error events may carry no payload */
      }
      patchStage(activeStageRef.current, 'error', `error · ${message}`);
      setIsRunning(false);
      eventSource.close();
    });
  }, [prompt, reset, patchStage, setActive]);

  return {
    prompt, setPrompt,
    isRunning,
    searchOutput, researchOutput, writeOutput,
    searchResults, queries,
    stages, activeStage,
    start,
  };
}