import type {
  LLMProvider,
  ChatMessage,
  ChatOptions
} from "./types.js";

export function createFailoverProvider(
  providers: LLMProvider[],
  onSwitch?: (info: { from: string; to: string; reason: string }) => void
): LLMProvider {
  let active = 0;

  return {
    get name() { return providers[active]!.name; },

    async chat(messages: ChatMessage[], options?: ChatOptions) {
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        if (!provider) continue;
        try {
          const result = await provider.chat(messages, options);
          if (i !== active) {
            onSwitch?.({ from: providers[active]!.name, to: provider.name, reason: 'unavailable' });
          }
          active = i;
          return result;
        } catch {
          continue;
        }
      }
      throw new Error("All providers failed");
    },

    async *chatStream(messages: ChatMessage[], options?: ChatOptions) {
      for (let i = active; i < providers.length; i++) {
        const provider = providers[i];
        if (!provider) continue;
        try {
          const gen = provider.chatStream(messages, options);
          const first = await gen.next();
          if (first.done) continue;
          if (i !== active) {
            onSwitch?.({ from: providers[active]!.name, to: provider.name, reason: 'unavailable' });
          }
          active = i;
          yield first.value;
          yield* gen;
          return;
        } catch {
          continue;
        }
      }
      throw new Error('All providers failed');
    },
  };
}