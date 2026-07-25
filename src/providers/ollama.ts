import { Ollama } from 'ollama';
import type { LLMProvider, ChatMessage, ChatOptions } from './types.js';

export function createOllamaProvider(): LLMProvider {
  const host = process.env.OLLAMA_HOST;
  if (!host) throw new Error('OLLAMA_HOST not set');

  const ollama = new Ollama({ host });
  const model = process.env.OLLAMA_MODEL || 'qwen35-uncensored';

  return {
    name: 'Ollama',

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
      const response = await ollama.chat({
        model,
        messages,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens,
        },
        think: false,
      });
      return response.message.content;
    },

    async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string> {
      const stream = await ollama.chat({
        model,
        messages,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens,
        },
        stream: true,
        think: false,
      });

      for await (const chunk of stream) {
        if (chunk.message.content) {
          yield chunk.message.content;
        }
      }
    },
  };
}
