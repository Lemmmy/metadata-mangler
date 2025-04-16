import type { LanguageModelUsage } from "ai";
import type { AITrack } from "./aiMetadata";

// Crude pessimistic estimate based on https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
export async function estimateGenericTokenUsage(
  model: string,
  prompt: string,
  tracks: AITrack[],
): Promise<LanguageModelUsage> {
  const inputTokens = prompt.length / 3;
  const outputTokens = JSON.stringify(tracks).length / 3;

  return {
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}
