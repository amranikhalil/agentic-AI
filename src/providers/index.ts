import type { LLMProvider } from './types.js';
import { createDeepSeekProvider } from './deepseek.js';
import { createOllamaProvider } from './ollama.js';

export function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'deepseek';
  
  if (provider === 'ollama') {
    return createOllamaProvider();
  }
  
  return createDeepSeekProvider();
}

export type { LLMProvider, ChatMessage, ChatOptions } from './types.js';
