import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect, useMemo, type ReactElement } from "react";
import type { WebSupportedModel } from "~/lib/ai/aiProviders";
import { useTRPC } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export function useModelPicker(): [string, ReactElement] {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.models.supportedModels.queryOptions(),
  );

  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    "model",
    data?.defaultModel || "",
  );

  const defaultModel = data?.defaultModel;
  const supportedModels = useMemo(
    () =>
      (data?.supportedModels || [])
        .filter((model) => model.isAvailable)
        .reduce(
          (acc, model) => ({ ...acc, [model.id]: model }),
          {} as Record<string, WebSupportedModel>,
        ),
    [data],
  );

  useEffect(() => {
    if (defaultModel && (!selectedModel || !supportedModels[defaultModel])) {
      setSelectedModel(defaultModel);
    }
  }, [supportedModels, selectedModel, setSelectedModel, defaultModel]);

  const modelPicker = (
    <div className="flex items-baseline">
      <label className="text-muted-foreground p-1 text-xs">Model</label>
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
  );

  return [selectedModel, modelPicker];
}
