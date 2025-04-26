import React, { useEffect } from "react";
import { toast } from "sonner";

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

  const openUrl = (url: string, automatic = false) => {
    console.log(windowHandle?.closed);

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
