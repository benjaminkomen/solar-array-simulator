import { createContext, useContext, type ReactNode } from "react";
import { usePanelsManager, type UsePanelsManagerResult } from "@/hooks/usePanelsManager";

const PanelsContext = createContext<UsePanelsManagerResult | null>(null);

export function PanelsProvider({ children }: { children: ReactNode }) {
  const panelsManager = usePanelsManager();

  return (
    <PanelsContext.Provider value={panelsManager}>
      {children}
    </PanelsContext.Provider>
  );
}

export function usePanelsContext() {
  const context = useContext(PanelsContext);
  if (!context) {
    throw new Error("usePanelsContext must be used within PanelsProvider");
  }
  return context;
}
