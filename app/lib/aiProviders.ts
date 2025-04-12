import { anthropic } from "@ai-sdk/anthropic";
import { openrouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel, LanguageModelUsage } from "ai";
import { z } from "zod";
import type { AITrack } from "./aiMetadata";
import { estimateAnthropicTokenUsage } from "./aiProviderAnthropic";
import { env } from "./env";

const hasAnthropic = () => !!env.ANTHROPIC_API_KEY;
const hasOpenRouter = () => !!env.OPENROUTER_API_KEY;

export interface SupportedModel {
  id: string;
  name: string;
  isAvailable: () => boolean;
  provider: () => LanguageModel;
  inputUsdPer1Mil: number;
  outputUsdPer1Mil: number;
  estimateUsageFn?: (
    model: string,
    prompt: string,
    tracks: AITrack[],
  ) => Promise<LanguageModelUsage>;
}

export const supportedModels: SupportedModel[] = [
  // Models from OpenRouter
  {
    id: "openrouter/optimus-alpha",
    name: "Optimus Alpha",
    isAvailable: hasOpenRouter,
    provider: () => openrouter("openrouter/optimus-alpha"),
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },

  // Models from Anthropic
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    isAvailable: hasAnthropic,
    provider: () => anthropic("claude-3-5-sonnet-latest"),
    inputUsdPer1Mil: 0.8,
    outputUsdPer1Mil: 4.0,
    estimateUsageFn: estimateAnthropicTokenUsage,
  },
];

export const supportedModelLut: Record<string, SupportedModel> =
  supportedModels.reduce(
    (acc, model) => {
      acc[model.id] = model;
      return acc;
    },
    {} as Record<string, SupportedModel>,
  );

export const supportedModelValidator = z
  .string()
  .refine((value) => !!supportedModelLut[value], {
    message: "Invalid model",
  });

export interface WebSupportedModel extends Pick<SupportedModel, "id" | "name"> {
  isAvailable: boolean;
  isFree: boolean;
}

export function getWebSupportedModels(): WebSupportedModel[] {
  return supportedModels.map((model) => {
    const isFree = model.inputUsdPer1Mil === 0 && model.outputUsdPer1Mil === 0;
    const priceSuffix = isFree
      ? " (free)"
      : ` ($${model.inputUsdPer1Mil.toFixed(2)} in/$${model.outputUsdPer1Mil.toFixed(2)} out)`;

    return {
      id: model.id,
      name: `${model.name}${priceSuffix}`,
      isAvailable: model.isAvailable(),
      isFree,
    };
  });
}

export interface PriceEstimate {
  promptPrice: number;
  completionPrice: number;
  totalPrice: number;
}

export type PriceUsage = PriceEstimate & LanguageModelUsage;

export function usageToPrice(
  usage: LanguageModelUsage | undefined,
  model: SupportedModel,
): PriceEstimate {
  if (!usage) {
    return { promptPrice: 0, completionPrice: 0, totalPrice: 0 };
  }

  const promptPrice = (usage.promptTokens * model.inputUsdPer1Mil) / 1_000_000;
  const completionPrice =
    (usage.completionTokens * model.outputUsdPer1Mil) / 1_000_000;
  const totalPrice = promptPrice + completionPrice;

  return { promptPrice, completionPrice, totalPrice };
}
