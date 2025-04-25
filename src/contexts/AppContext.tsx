import { createContext, useContext } from "react";
import { BaseApp, AppState } from "@/apps/base/types";
import { AppId } from "@/config/appRegistry";

interface AppContextType {
  appStates: { [appId: string]: AppState };
  toggleApp: (appId: string) => void;
  bringToForeground: (appId: string) => void;
  apps: BaseApp[];
  navigateToNextApp: (currentAppId: AppId) => void;
  navigateToPreviousApp: (currentAppId: AppId) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
}
