import type { LLMProvider } from './types.js';
import { createDeepSeekProvider } from './deepseek.js';
import { createOllamaProvider } from './ollama.js';
import { createGrokProvider } from './grok.js';

export function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'grok';
  
  if (provider === 'ollama') {
    return createOllamaProvider();
  }
  
  return createGrokProvider();
}

export type { LLMProvider, ChatMessage, ChatOptions } from './types.js';
