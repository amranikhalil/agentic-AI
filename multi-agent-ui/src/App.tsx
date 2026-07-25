import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export default function App() {
  const [prompt, setPrompt] = useState('Compare Express vs Fastify for building a REST API');
  const [status, setStatus] = useState('Idle');
  const [agent3Output, setAgent3Output] = useState('');
  const [agent1Output, setAgent1Output] = useState('');
  const [agent2Output, setAgent2Output] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const startPipeline = () => {
    setIsRunning(true);
    setAgent3Output('');
    setAgent1Output('');
    setAgent2Output('');
    setSearchResults([]);
    setStatus('Connecting to agent server...');

    const encodedPrompt = encodeURIComponent(prompt);
    const eventSource = new EventSource(`http://localhost:3001/api/stream-agents?prompt=${encodedPrompt}`);

    eventSource.addEventListener('status', (e: any) => {
      const data = JSON.parse(e.data);
      setStatus(data.message);
    });

    eventSource.addEventListener('agent3-token', (e: any) => {
      const data = JSON.parse(e.data);
      setAgent3Output((prev) => prev + data.chunk);
    });

    eventSource.addEventListener('search-results', (e: any) => {
      const data = JSON.parse(e.data);
      setSearchResults(data.results || []);
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
      setStatus('✅ Pipeline Complete');
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e: any) => {
      const data = JSON.parse(e.data);
      setStatus(`❌ ${data.message}`);
      setIsRunning(false);
      eventSource.close();
    });
  };

  const cardStyle = {
    background: '#2a2a2a',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #3a3a3a',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '500px',
  };

  const outputStyle = {
    flex: 1,
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#d0d0d0',
    overflowY: 'auto' as const,
    background: '#1a1a1a',
    padding: '0.75rem',
    borderRadius: '6px',
    lineHeight: 1.5,
  };

  const markdownStyle = {
    flex: 1,
    overflowY: 'auto' as const,
    background: '#1a1a1a',
    padding: '1.25rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    color: '#e0e0e0',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 600 }}>Tech Research Agent</h1>
        <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Multi-agent pipeline with live web search</p>
        <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.6rem', background: '#2a2a2a', borderRadius: '4px', fontSize: '0.7rem', color: '#888' }}>
          Provider: Ollama (Qwen 3.5)
        </span>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a technical question..."
          disabled={isRunning}
          style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '6px', border: '1px solid #3a3a3a', background: '#1a1a1a', color: '#e0e0e0', fontSize: '0.9rem' }}
        />
        <button
          onClick={startPipeline}
          disabled={isRunning}
          style={{ padding: '0.7rem 1.25rem', borderRadius: '6px', border: 'none', background: isRunning ? '#3a3a3a' : '#5a5a5a', color: '#fff', fontWeight: 500, cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>

      {/* Status */}
      <div style={{ padding: '0.6rem 0.9rem', background: '#2a2a2a', borderLeft: '3px solid #5a5a5a', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', color: '#ccc' }}>
        {status}
      </div>

      {/* Pipeline Strip */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
        {['🔍 Search', '📊 Research', '✍️ Write'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.3rem 0.7rem', background: '#2a2a2a', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #3a3a3a' }}>
              {label}
            </span>
            {i < 2 && <span style={{ color: '#555' }}>→</span>}
          </div>
        ))}
      </div>

      {/* Agent Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Search Agent */}
        <div style={cardStyle}>
          <h3 style={{ color: '#ffa500', margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600 }}>🔍 Search Agent</h3>
          <div style={outputStyle}>
            {agent3Output || 'Waiting...'}
          </div>
        </div>

        {/* Researcher */}
        <div style={cardStyle}>
          <h3 style={{ color: '#4a9eff', margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600 }}>📊 Researcher</h3>
          <div style={outputStyle}>
            {agent1Output || 'Waiting for search...'}
          </div>
        </div>
      </div>

      {/* Writer - Full Width */}
      <div style={{ background: '#2a2a2a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #3a3a3a', marginBottom: '1rem' }}>
        <h3 style={{ color: '#4ade80', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>✍️ Writer — Final Report</h3>
        <div style={{ ...markdownStyle, maxHeight: '600px' }}>
          {agent2Output ? (
              <ReactMarkdown
                components={{
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{ border: '1px solid #3a3a3a', padding: '0.6rem 0.75rem', background: '#2a2a2a', textAlign: 'left', fontWeight: 600 }}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td style={{ border: '1px solid #3a3a3a', padding: '0.6rem 0.75rem' }}>
                      {children}
                    </td>
                  ),
                  h1: ({ children }) => <h1 style={{ fontSize: '1.4rem', marginTop: '0.75rem', marginBottom: '0.75rem', fontWeight: 600 }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: '1.2rem', marginTop: '1rem', marginBottom: '0.6rem', fontWeight: 600 }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: '1.05rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>{children}</h3>,
                  p: ({ children }) => <p style={{ marginBottom: '0.85rem', lineHeight: 1.8 }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ marginBottom: '0.85rem', paddingLeft: '1.5rem' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ marginBottom: '0.85rem', paddingLeft: '1.5rem' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: '0.4rem', lineHeight: 1.7 }}>{children}</li>,
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff', textDecoration: 'none' }}>
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code style={{ background: '#2a2a2a', padding: '0.15rem 0.4rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre style={{ background: '#2a2a2a', padding: '1rem', borderRadius: '4px', overflowX: 'auto', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      {children}
                    </pre>
                  ),
                }}
              >
                {agent2Output}
              </ReactMarkdown>
            ) : (
              'Waiting for researcher...'
            )}
          </div>
      </div>

      {/* Sources Panel */}
      {searchResults.length > 0 && (
        <div style={{ background: '#2a2a2a', padding: '1rem', borderRadius: '8px', border: '1px solid #3a3a3a' }}>
          <h3 style={{ color: '#a78bfa', margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600 }}>📎 Sources ({searchResults.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.6rem' }}>
            {searchResults.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', padding: '0.6rem', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #3a3a3a', textDecoration: 'none', color: '#d0d0d0' }}
              >
                <div style={{ fontWeight: 600, color: '#4a9eff', marginBottom: '0.25rem', fontSize: '0.8rem', lineHeight: 1.3 }}>{r.title}</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem', lineHeight: 1.4 }}>{r.snippet?.substring(0, 100)}...</div>
                <div style={{ fontSize: '0.65rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
