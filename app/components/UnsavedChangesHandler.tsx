import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMetadataStore } from "./album/useMetadataStore";

/**
 * Component that prevents the tab from being closed if there are unsaved changes
 * by showing a confirmation dialog.
 */
export function UnsavedChangesHandler() {
  // Check if there are unsaved changes
  const { hasUnsavedChanges } = useMetadataStore(
    useShallow((s) => ({
      hasUnsavedChanges: Object.values(s.updatedFields).some((set) =>
        Object.values(set).some((v) => v),
      ),
    })),
  );

  useEffect(() => {
    // Handler for beforeunload event
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Standard way to show a confirmation dialog
        // The message is typically ignored by modern browsers, which show a generic message instead
        const message =
          "You have unsaved changes. Are you sure you want to leave?";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    // Add event listener when component mounts
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // This component doesn't render anything
  return null;
}
