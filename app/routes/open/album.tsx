import { useEffect } from "react";
import { useNavigate } from "react-router";

// Channel name for communication between tabs
export const OPEN_ALBUM_CHANNEL_NAME = "metadata-mangler-open-album";

export default function OpenAlbum() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the path from the URL
    const path = window.location.pathname.replace("/open/album/", "");
    if (!path) {
      navigate("/");
      return;
    }

    // Create a BroadcastChannel for cross-tab communication
    const channel = new BroadcastChannel(OPEN_ALBUM_CHANNEL_NAME);

    // Create a unique message ID for this request
    const messageId = Date.now().toString();

    // Track if any tab has responded
    let hasResponse = false;

    // Listen for responses from other tabs
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "album-open-response" &&
        event.data?.messageId === messageId
      ) {
        hasResponse = true;
        // Another tab will handle the navigation, so we can close this tab
        window.close();
      }
    };

    channel.addEventListener("message", handleMessage);

    // Send the request to other tabs
    channel.postMessage({
      type: "album-open-request",
      path: path,
      messageId: messageId,
    });

    // If no response after a short delay, navigate in this tab
    const timeout = setTimeout(() => {
      if (!hasResponse) {
        navigate(`/album/${path}`);
      }
    }, 300); // 300ms should be enough for other tabs to respond

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Opening album...</h1>
        <p className="text-muted-foreground mt-2">
          If this page doesn&apos;t redirect,{" "}
          <a href="/" className="text-primary underline">
            click here
          </a>{" "}
          to go home.
        </p>
      </div>
    </div>
  );
}
