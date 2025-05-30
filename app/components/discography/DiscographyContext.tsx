import { createContext, useContext } from "react";

interface DiscographyContextType {
  discographyId: string;
  onDataChange: () => void;
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
  return (
    <DiscographyContext.Provider
      value={{
        discographyId,
        onDataChange,
      }}
    >
      {children}
    </DiscographyContext.Provider>
  );
}
