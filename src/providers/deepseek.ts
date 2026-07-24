import OpenAI from 'openai';
import type { LLMProvider, ChatMessage, ChatOptions } from './types.js';

export function createDeepSeekProvider(): LLMProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');

  const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey,
  });

  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  return {
    name: 'DeepSeek',

    async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: false,
      });
      return response.choices[0]?.message?.content ?? '';
    },

    async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string> {
      const stream = await client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      }
    },
  };
}
