import { STAGE_META, type SearchResult, type StageState } from '../../types';
import { domainOf, faviconUrl } from '../../lib';

interface Props {
  results: SearchResult[];
  queries: string[];
  stageState: StageState;
}

export function SourcesStage({ results, queries, stageState }: Props) {
  if (results.length === 0) {
    return (
      <div className="pl__empty">
        <div className="pl__emptyLabel">{STAGE_META.sources.name}</div>
        <div className="pl__emptyDesc">
          {stageState === 'running' ? 'Waiting on search results…' : STAGE_META.sources.role}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="pl__srcCount">
        {results.length} sources fetched · {queries.length} queries
      </div>
      <ul className="pl__srcList">
        {results.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="pl__src">
            <span className="pl__srcIdx">{String(i + 1).padStart(2, '0')}</span>
            <img
              className="pl__srcFav"
              src={faviconUrl(r.url)}
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
            <span className="pl__srcTitle">{r.title}</span>
            <span className="pl__srcDomain">{domainOf(r.url)}</span>
          </a>
        ))}
      </ul>
    </>
  );
}