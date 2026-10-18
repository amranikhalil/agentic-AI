import type { LLMProvider, switchCallBack } from './types.js';
import { createOllamaProvider } from './ollama.js';
import { createGrokProvider } from './grok.js';
import { createFailoverProvider } from './failOverProvider.js';

export function getProvider(onSwitch?: switchCallBack): LLMProvider {
  const primary = process.env.LLM_PROVIDER ?? 'ollama';

  const factories: { name: string; create: () => LLMProvider }[] = [
    { name: 'ollama', create: createOllamaProvider },
    { name: 'grok',   create: createGrokProvider },
  ];

  // primary first, then the rest
  const ordered = [
    ...factories.filter(f => f.name === primary),
    ...factories.filter(f => f.name !== primary),
  ];

  const providers: LLMProvider[] = [];
  for (const f of ordered) {
    try {
      providers.push(f.create());
    } catch {
      // provider unavailable (missing API key, host, etc.) — skip
    }
  }

  if (providers.length === 0) {
    throw new Error('No LLM providers available — check OLLAMA_HOST / GROQ_API_KEY');
  }
  if (providers.length === 1) {
    return providers[0]!;
  }

  console.log(`🔗 Failover chain: ${providers.map(p => p.name).join(' → ')}`);
  return createFailoverProvider(providers, onSwitch);
}

export type { LLMProvider, ChatMessage, ChatOptions } from './types.js';