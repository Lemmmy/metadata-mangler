import { useEffect, useState, type ReactElement } from "react";
import { useTRPC } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function useModelPicker(): [string, ReactElement] {
  const trpc = useTRPC();
  const supportedModelData = useQuery(
    trpc.models.supportedModels.queryOptions(),
  );

  const [selectedModel, setSelectedModel] = useState<string>(
    supportedModelData.data?.defaultModel || "",
  );

  useEffect(() => {
    if (supportedModelData.data && !selectedModel) {
      setSelectedModel(supportedModelData.data.defaultModel);
    }
  }, [supportedModelData.data, selectedModel]);

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
