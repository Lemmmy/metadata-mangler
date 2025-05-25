import React, { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useMetadataStore } from "./album/useMetadataStore";
import { OPEN_ALBUM_CHANNEL_NAME } from "~/routes/open/album";

interface SyncedBrowserContextType {
  openUrl: (url: string, automatic?: boolean) => void;
  isOpen: boolean;
}

export const SyncedBrowserContext =
  React.createContext<SyncedBrowserContextType>({
    openUrl: () => {},
    isOpen: false,
  });

export function SyncedBrowserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windowHandle, setWindowHandle] = React.useState<Window | null>(null);
  const navigate = useNavigate();

  // Check if there are unsaved changes
  const { hasUnsavedChanges } = useMetadataStore(
    useShallow((s) => ({
      hasUnsavedChanges: Object.values(s.updatedFields).some((set) =>
        Object.values(set).some((v) => v),
      ),
    })),
  );

  const openUrl = (url: string, automatic = false) => {
    if (windowHandle?.closed === false && automatic) {
      windowHandle.focus();
      // eslint-disable-next-line react-compiler/react-compiler
      windowHandle.location.href = url;
      return;
    } else if (automatic) {
      setWindowHandle(null);
      return;
    }

    const handle = window.open(
      url,
      "syncedBrowser",
      "popup=true,width=1600,height=900",
    );
    if (!handle) {
      toast.error("Failed to open browser");
      setWindowHandle(null);
      return;
    }

    setWindowHandle(handle);
  };

  useEffect(() => {
    // Check if the synced browser is still open
    const interval = setInterval(() => {
      if (windowHandle?.closed === true) {
        setWindowHandle(null);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [windowHandle]);

  // Listen for broadcast messages from /open/album tabs
  useEffect(() => {
    const channel = new BroadcastChannel(OPEN_ALBUM_CHANNEL_NAME);

    const handleMessage = (event: MessageEvent) => {
      // Handle album open requests
      if (event.data?.type === "album-open-request") {
        const { path, messageId } = event.data;

        // Only respond if this tab has the Synced Browser open and no unsaved changes
        if (windowHandle?.closed === false && !hasUnsavedChanges) {
          // Respond to the request to indicate we'll handle it
          channel.postMessage({
            type: "album-open-response",
            messageId: messageId,
          });

          // Focus this window/tab
          window.focus();

          // Navigate to the requested album path
          navigate(`/album/${path}`);
        }
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [windowHandle, hasUnsavedChanges, navigate]);

  return (
    <SyncedBrowserContext.Provider
      value={{
        openUrl,
        isOpen: windowHandle?.closed === false,
      }}
    >
      {children}
    </SyncedBrowserContext.Provider>
  );
}

export function useSyncedBrowserState() {
  const context = React.useContext(SyncedBrowserContext);
  if (!context) {
    throw new Error(
      "useSyncedBrowserState must be used within a SyncedBrowserProvider",
    );
  }
  return context;
}
