import { Loader2 } from "lucide-react";
import type { PriceUsage } from "~/lib/aiProviders";

interface Props {
  usage: Partial<PriceUsage> | null | undefined;
  isEstimate: boolean;
  pending: boolean;
}

export function ModelUsage({ usage, isEstimate, pending }: Props) {
  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      {usage?.totalPrice && (
        <span>
          {isEstimate ? "Estimate" : "Used"}: ${usage.totalPrice.toFixed(4)}
        </span>
      )}
      {typeof usage?.promptTokens !== "undefined" && (
        <span>
          ({Math.floor(usage.promptTokens || 0).toLocaleString()} in{" "}
          {Math.floor(usage.completionTokens || 0).toLocaleString()} out)
        </span>
      )}
      {pending && (
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      )}
    </div>
  );
}
