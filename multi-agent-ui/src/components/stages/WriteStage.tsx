import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { STAGE_META, type StageState } from '../../types';

interface Props {
  text: string;
  stageState: StageState;
}

export function WriteStage({ text, stageState }: Props) {
  const streaming = stageState === 'running';

  if (!text) {
    return (
      <div className="pl__empty">
        <div className="pl__emptyLabel">{STAGE_META.write.name}</div>
        <div className="pl__emptyDesc">
          {stageState === 'running' ? 'Writer is composing the report…' : STAGE_META.write.role}
        </div>
      </div>
    );
  }

  return (
    <div className="pl__report">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: '1lh' }}>
              <table>{children}</table>
            </div>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
      {streaming && <span className="pl__cursor" />}
    </div>
  );
}