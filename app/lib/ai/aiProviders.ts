import { anthropic } from "@ai-sdk/anthropic";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel, LanguageModelUsage } from "ai";
import * as v from "valibot";
import type { AITrack } from "./aiMetadata";
import { estimateAnthropicTokenUsage } from "./aiProviderAnthropic";
import { env } from "../env";

const hasAnthropic = () => !!env.ANTHROPIC_API_KEY;
const hasOpenRouter = () => !!env.OPENROUTER_API_KEY;
const hasOpenAI = () => !!env.OPENAI_API_KEY;
const hasGoogle = () => !!env.GOOGLE_GENERATIVE_AI_API_KEY;

export interface SupportedModel {
  id: string;
  name: string;
  isAvailable: () => boolean;
  provider: (id: string) => LanguageModel;
  inputUsdPer1Mil: number;
  outputUsdPer1Mil: number;
  estimateUsageFn?: (
    model: string,
    system: string,
    prompt: string,
    tracks: AITrack[],
  ) => Promise<LanguageModelUsage>;
}

export const supportedModels: SupportedModel[] = [
  // Models from OpenRouter
  {
    id: "google/gemini-2.5-pro-exp-03-25:free",
    name: "Google Gemini 2.5 Pro Experimental",
    isAvailable: hasOpenRouter,
    provider: openrouter,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Google Gemini 2.0 Flash Experimental",
    isAvailable: hasOpenRouter,
    provider: openrouter,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },
  {
    id: "google/gemini-flash-1.5-8b-exp",
    name: "Google Gemini Flash 1.5 8B Experimental",
    isAvailable: hasOpenRouter,
    provider: openrouter,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1 24B",
    isAvailable: hasOpenRouter,
    provider: openrouter,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B Instruct",
    isAvailable: hasOpenRouter,
    provider: openrouter,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
  },

  // Models from Anthropic
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Anthropic Claude 3.5 Sonnet v2",
    isAvailable: hasAnthropic,
    provider: anthropic,
    inputUsdPer1Mil: 3.0,
    outputUsdPer1Mil: 15.0,
    estimateUsageFn: estimateAnthropicTokenUsage,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Anthropic Claude 3.5 Haiku",
    isAvailable: hasAnthropic,
    provider: anthropic,
    inputUsdPer1Mil: 0.8,
    outputUsdPer1Mil: 4.0,
    estimateUsageFn: estimateAnthropicTokenUsage,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Anthropic Claude 3 Haiku",
    isAvailable: hasAnthropic,
    provider: anthropic,
    inputUsdPer1Mil: 0.25,
    outputUsdPer1Mil: 1.25,
    estimateUsageFn: estimateAnthropicTokenUsage,
  },

  // Models from OpenAI
  {
    id: "gpt-4.1-2025-04-14",
    name: "OpenAI GPT-4.1",
    isAvailable: hasOpenAI,
    provider: openai,
    inputUsdPer1Mil: 2.0,
    outputUsdPer1Mil: 8.0,
  },
  {
    id: "gpt-4o-2024-08-06",
    name: "OpenAI GPT-4o",
    isAvailable: hasOpenAI,
    provider: openai,
    inputUsdPer1Mil: 2.5,
    outputUsdPer1Mil: 10.0,
  },
  {
    id: "gpt-4.1-mini-2025-04-14",
    name: "OpenAI GPT-4.1 mini",
    isAvailable: hasOpenAI,
    provider: openai,
    inputUsdPer1Mil: 0.4,
    outputUsdPer1Mil: 1.6,
  },
  {
    id: "gpt-4o-mini-2024-07-18",
    name: "OpenAI GPT-4o mini",
    isAvailable: hasOpenAI,
    provider: openai,
    inputUsdPer1Mil: 0.15,
    outputUsdPer1Mil: 0.6,
  },

  // Models from Google
  {
    id: "gemini-2.5-pro",
    name: "Google Gemini 2.5 Pro",
    isAvailable: hasGoogle,
    provider: google,
    inputUsdPer1Mil: 1.25,
    outputUsdPer1Mil: 10.0,
  },
  {
    id: "gemini-2.5-flash",
    name: "Google Gemini 2.5 Flash",
    isAvailable: hasGoogle,
    provider: google,
    inputUsdPer1Mil: 0.3,
    outputUsdPer1Mil: 2.5,
  },
  {
    id: "gemini-2.0-flash",
    name: "Google Gemini 2.0 Flash",
    isAvailable: hasGoogle,
    provider: google,
    inputUsdPer1Mil: 0,
    outputUsdPer1Mil: 0,
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

export const supportedModelValidator = v.pipe(
  v.string(),
  v.check((value) => !!supportedModelLut[value], "Invalid model"),
);

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
