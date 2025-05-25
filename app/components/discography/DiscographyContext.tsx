import { useLocalStorage } from "@uidotdev/usehooks";
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
} from "react";

interface DiscographyContextType {
  discographyId: string;
  onDataChange: () => void;
  includeIgnoredVgmdbRoles: boolean;
  setIncludeIgnoredVgmdbRoles: Dispatch<SetStateAction<boolean>>;
}

export const DiscographyContext = createContext<DiscographyContextType | null>(
  null,
);

export function useDiscographyContext() {
  const context = useContext(DiscographyContext);
  if (!context) {
    throw new Error(
      "useDiscographyContext must be used within a DiscographyContextProvider",
    );
  }
  return context;
}

interface DiscographyContextProviderProps {
  discographyId: string;
  onDataChange: () => void;
  children: React.ReactNode;
}

export function DiscographyContextProvider({
  discographyId,
  onDataChange,
  children,
}: DiscographyContextProviderProps) {
  const ignoredRolesKey = `includeIgnoredVgmdbRoles-${discographyId}`;
  const [includeIgnoredVgmdbRoles, setIncludeIgnoredVgmdbRoles] =
    useLocalStorage<boolean>(ignoredRolesKey, false);

  return (
    <DiscographyContext.Provider
      value={{
        discographyId,
        onDataChange,
        includeIgnoredVgmdbRoles,
        setIncludeIgnoredVgmdbRoles,
      }}
    >
      {children}
    </DiscographyContext.Provider>
  );
}
