import { Anthropic } from "@anthropic-ai/sdk";
import type { LanguageModelUsage } from "ai";
import type { AITrack } from "./aiMetadata";
import { env } from "../env";

const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export async function estimateAnthropicTokenUsage(
  model: string,
  prompt: string,
  tracks: AITrack[],
): Promise<LanguageModelUsage> {
  if (!anthropic) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  const response = await anthropic.messages.countTokens({
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const inputTokens = response.input_tokens;
  const outputTokens = JSON.stringify(tracks).length / 3;

  return {
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}
