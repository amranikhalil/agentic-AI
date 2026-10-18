export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
}
export interface searchResult {
  title : string;
  snippet: string;
  url : string
  source?: 'web' | 'wiki'
}
export  interface SearchResonse {
  queries: string[];
  results : searchResult[]
}

export interface AgentMessage {
  agent: 'search' | 'researcher' | 'writer';
  state: 'thinking' | 'completed';
  message: string;
}
export  interface switchinfo {
  from : string,
  to:string,
  reason:string 
}
export type switchCallBack=(info:switchinfo)=>void