import React, { useState } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('Explain how to build an agentic RAG system with Node.js and Vector DBs.');
  const [status, setStatus] = useState('Idle');
  const [agent1Output, setAgent1Output] = useState('');
  const [agent2Output, setAgent2Output] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const startPipeline = () => {
    setIsRunning(true);
    setAgent1Output('');
    setAgent2Output('');
    setStatus('Connecting to local agent server...');

    const encodedPrompt = encodeURIComponent(prompt);
    const eventSource = new EventSource(`http://localhost:3001/api/stream-agents?prompt=${encodedPrompt}`);

    eventSource.addEventListener('status', (e: any) => {
      const data = JSON.parse(e.data);
      setStatus(data.message);
    });

    eventSource.addEventListener('agent1-token', (e: any) => {
      const data = JSON.parse(e.data);
      setAgent1Output((prev) => prev + data.chunk);
    });

    eventSource.addEventListener('agent2-token', (e: any) => {
      const data = JSON.parse(e.data);
      setAgent2Output((prev) => prev + data.chunk);
    });

    eventSource.addEventListener('done', () => {
      setStatus('✅ Multi-Agent Execution Complete');
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e: any) => {
      setStatus('❌ Error connecting to backend');
      setIsRunning(false);
      eventSource.close();
    });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>⚡ Multi-Agent System Dashboard</h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>Powered by Local Node.js SSE + Kaggle Remote GPU (Qwen 3.5)</p>

      {/* Input Section */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a technical topic..."
          disabled={isRunning}
          style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '1rem' }}
        />
        <button
          onClick={startPipeline}
          disabled={isRunning}
          style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', background: isRunning ? '#475569' : '#2563eb', color: '#fff', fontWeight: 'bold', cursor: isRunning ? 'not-allowed' : 'pointer' }}
        >
          {isRunning ? 'Running...' : 'Run Pipeline'}
        </button>
      </div>

      {/* Status Banner */}
      <div style={{ padding: '0.75rem 1rem', background: '#1e293b', borderLeft: '4px solid #3b82f6', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.95rem' }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Grid Layout for Agents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Agent 1 Card */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 1rem 0' }}>🔍 Agent 1: Researcher</h3>
          <div style={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1', overflowY: 'auto', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            {agent1Output || 'Waiting to start...'}
          </div>
        </div>

        {/* Agent 2 Card */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#34d399', margin: '0 0 1rem 0' }}>✍️ Agent 2: Writer</h3>
          <div style={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: '#cbd5e1', overflowY: 'auto', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            {agent2Output || 'Waiting for Agent 1 to complete...'}
          </div>
        </div>
      </div>
    </div>
  );
}