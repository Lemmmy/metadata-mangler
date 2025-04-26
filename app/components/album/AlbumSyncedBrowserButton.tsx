import { useShallow } from "zustand/react/shallow";
import { useSyncedBrowserState } from "../SyncedBrowser";
import { Button } from "../ui/button";
import { useMetadataStore } from "./useMetadataStore";
import { useEffect } from "react";
import { AppWindow } from "lucide-react";
import { cn } from "~/lib/utils";

export function AlbumSyncedBrowserButton() {
  const { isOpen, openUrl } = useSyncedBrowserState();
  const urlOrData = useMetadataStore(useShallow((s) => s.urlOrData));
  const urlIsValid = isValidUrl(urlOrData);

  useEffect(() => {
    if (isOpen && urlIsValid) {
      openUrl(urlOrData, true);
    }
  }, [isOpen, openUrl, urlOrData, urlIsValid]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => urlIsValid && openUrl(urlOrData)}
      disabled={!urlIsValid}
      className={cn(isOpen && "ring-2 ring-green-500")}
    >
      <AppWindow />
      Synced browser
    </Button>
  );
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (ignored) {
    return false;
  }
}
