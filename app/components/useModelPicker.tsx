import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect, type ReactElement } from "react";
import { useTRPC } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export function useModelPicker(): [string, ReactElement] {
  const trpc = useTRPC();
  const supportedModelData = useQuery(
    trpc.models.supportedModels.queryOptions(),
  );

  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    "model",
    supportedModelData.data?.defaultModel || "",
  );

  useEffect(() => {
    if (
      supportedModelData.data &&
      (!selectedModel ||
        !supportedModelData.data.supportedModels.find(
          (model) => model.id === selectedModel,
        ))
    ) {
      setSelectedModel(supportedModelData.data.defaultModel);
    }
  }, [supportedModelData.data, selectedModel, setSelectedModel]);

  const modelPicker = (
    <div className="flex items-baseline">
      <label className="text-muted-foreground p-1 text-xs">Model</label>
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className={cn(
          "text-foreground w-full rounded-md border-none bg-transparent p-1 text-xs",
          "hover:bg-input cursor-pointer",
          "",
        )}
      >
        {supportedModelData.data?.supportedModels.map((model) => (
          <option key={model.id} value={model.id} className="bg-background">
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );

  return [selectedModel, modelPicker];
}
