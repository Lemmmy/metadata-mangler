import { useAsyncThrottler } from "@tanstack/react-pacer";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from "react";
import { useShallow } from "zustand/react/shallow";
import type { PriceUsage, WebSupportedModel } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import { useMetadataStore } from "./album/useMetadataStore";
import { ModelUsage } from "./ModelUsage";

interface UseModelPickerResult {
  selectedModel: string;
  modelPicker: ReactElement;
  setUsage: Dispatch<SetStateAction<PriceUsage | null>>;
}

export function useModelPicker(): UseModelPickerResult {
  // Supported models query
  const trpc = useTRPC();
  const { data: supportedModelData, isLoading } = useQuery(
    trpc.models.supportedModels.queryOptions(),
  );

  // Selected model & supported models in picker
  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    "model",
    supportedModelData?.defaultModel || "",
  );

  const defaultModel = supportedModelData?.defaultModel;
  const supportedModels = useMemo(
    () =>
      (supportedModelData?.supportedModels || [])
        .filter((model) => model.isAvailable)
        .reduce(
          (acc, model) => ({ ...acc, [model.id]: model }),
          {} as Record<string, WebSupportedModel>,
        ),
    [supportedModelData],
  );

  useEffect(() => {
    // Reset selected model if default model is not available
    if (defaultModel && (!selectedModel || !supportedModels[defaultModel])) {
      setSelectedModel(defaultModel);
    }
  }, [supportedModels, selectedModel, setSelectedModel, defaultModel]);

  // Usage & estimates
  const [usage, setUsage] = useState<PriceUsage | null>(null);
  const { data: estimateData, mutate: mutateEstimate } = useMutation(
    trpc.metadata.lookup.mutationOptions(),
  );

  const estimateThrottler = useAsyncThrottler(
    async (
      urlOrData: string,
      additionalInfo: string,
      selectedModel: string,
    ) => {
      if (!urlOrData.trim()) return;

      try {
        const bareState = useMetadataStore.getState();
        const album = bareState.album;
        const tracks = bareState.tracks;

        mutateEstimate({
          input: urlOrData,
          additionalInfo: additionalInfo || undefined,
          modelId: selectedModel,
          albumName: album?.name || "",
          albumArtist: album?.artist || "",
          tracks,
          estimateOnly: true,
        });
      } catch (error) {
        console.error("Error during lookup:", error);
      }
    },
    {
      wait: 500,
    },
  );

  // Update the estimate when anything changes
  const { urlOrData, additionalInfo, album } = useMetadataStore(
    useShallow((s) => ({
      urlOrData: s.urlOrData,
      additionalInfo: s.additionalInfo,
      album: s.album,
    })),
  );

  useEffect(() => {
    if (urlOrData.trim() && album) {
      estimateThrottler.maybeExecute(urlOrData, additionalInfo, selectedModel);
    }
  }, [urlOrData, additionalInfo, album, estimateThrottler, selectedModel]);

  const modelPicker = (
    <div className="flex h-[41px] flex-col justify-center px-1">
      {/* Model Picker */}
      <div className="flex items-baseline">
        <label className="text-muted-foreground text-xs">Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isLoading}
          className={cn(
            "text-foreground w-full rounded-md border-none bg-transparent p-1 text-xs",
            "hover:bg-input cursor-pointer",
          )}
        >
          {Object.values(supportedModels).map((model) => (
            <option key={model.id} value={model.id} className="bg-background">
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* Estimate/usage */}
      <ModelUsage
        isEstimate={!usage}
        usage={(usage || estimateData) as PriceUsage}
      />
    </div>
  );

  return {
    selectedModel: selectedModel,
    modelPicker,
    setUsage,
  };
}
