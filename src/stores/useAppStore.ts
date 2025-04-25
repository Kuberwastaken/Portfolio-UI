import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppId } from "@/config/appRegistry";
import { AppManagerState, AppState } from "@/apps/base/types";

// Define available AI models (matching API options from chat.ts)
export type AIModel = "gpt-4o" | "gpt-4.1" | "gpt-4.1-mini" | "claude-3.5" | "claude-3.7" | "o3-mini" | "gemini-2.5-pro-exp-03-25" | null;

// Define known app IDs directly here to avoid circular dependency
const APP_IDS = [
  "finder",
  "soundboard",
  "internet-explorer",
  "chats",
  "textedit",
  "paint",
  "photo-booth",
  "minesweeper",
  "videos",
  "ipod",
  "synth",
  "pc",
  "terminal",
  "control-panels",
] as const;

const getInitialState = (): AppManagerState => ({
  windowOrder: [],
  apps: APP_IDS.reduce(
    (acc, appId) => ({
      ...acc,
      [appId]: { isOpen: false },
    }),
    {} as { [appId: string]: AppState }
  ),
});

interface AppStoreState extends AppManagerState {
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  aiModel: AIModel;
  setAiModel: (model: AIModel) => void;
  terminalSoundsEnabled: boolean;
  setTerminalSoundsEnabled: (enabled: boolean) => void;
  bringToForeground: (appId: AppId | "") => void;
  toggleApp: (appId: AppId) => void;
  navigateToNextApp: (currentAppId: AppId) => void;
  navigateToPreviousApp: (currentAppId: AppId) => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      debugMode: false,
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      aiModel: null, // Default model set to null for client-side
      setAiModel: (model) => set({ aiModel: model }),
      terminalSoundsEnabled: true, // Default to true for terminal/IE sounds
      setTerminalSoundsEnabled: (enabled) => set({ terminalSoundsEnabled: enabled }),

      bringToForeground: (appId) => {
        set((state) => {
          const newState: AppManagerState = {
            windowOrder: [...state.windowOrder],
            apps: { ...state.apps },
          };

          // If empty string provided, just clear foreground flags
          if (!appId) {
            Object.keys(newState.apps).forEach((id) => {
              newState.apps[id] = { ...newState.apps[id], isForeground: false };
            });
          } else {
            // Re‑order windowOrder so that appId is last (top‑most)
            newState.windowOrder = [
              ...newState.windowOrder.filter((id) => id !== appId),
              appId,
            ];

            // Set foreground flags
            Object.keys(newState.apps).forEach((id) => {
              newState.apps[id] = {
                ...newState.apps[id],
                isForeground: id === appId,
              };
            });
          }

          // Emit DOM event (keep behaviour parity)
          const appStateChangeEvent = new CustomEvent("appStateChange", {
            detail: {
              appId,
              isOpen: newState.apps[appId]?.isOpen || false,
              isForeground: true,
            },
          });
          window.dispatchEvent(appStateChangeEvent);

          return newState;
        });
      },

      toggleApp: (appId) => {
        set((state) => {
          const isCurrentlyOpen = state.apps[appId]?.isOpen;

          const newWindowOrder = isCurrentlyOpen
            ? state.windowOrder.filter((id) => id !== appId)
            : [...state.windowOrder, appId];

          const newApps: { [appId: string]: AppState } = { ...state.apps };

          Object.keys(newApps).forEach((id) => {
            if (id === appId) {
              newApps[id] = {
                ...newApps[id],
                isOpen: !isCurrentlyOpen,
                isForeground: !isCurrentlyOpen,
              };
            } else {
              newApps[id] = { ...newApps[id], isForeground: false };
            }
          });

          const newState: AppManagerState = {
            windowOrder: newWindowOrder,
            apps: newApps,
          };

          const appStateChangeEvent = new CustomEvent("appStateChange", {
            detail: {
              appId,
              isOpen: !isCurrentlyOpen,
              isForeground: !isCurrentlyOpen,
            },
          });
          window.dispatchEvent(appStateChangeEvent);

          return newState;
        });
      },

      navigateToNextApp: (currentAppId) => {
        const { windowOrder } = get();
        if (windowOrder.length <= 1) return;
        const currentIndex = windowOrder.indexOf(currentAppId);
        if (currentIndex === -1) return;
        const nextAppId = windowOrder[(currentIndex + 1) % windowOrder.length] as AppId;
        get().bringToForeground(nextAppId);
      },

      navigateToPreviousApp: (currentAppId) => {
        const { windowOrder } = get();
        if (windowOrder.length <= 1) return;
        const currentIndex = windowOrder.indexOf(currentAppId);
        if (currentIndex === -1) return;
        const prevIndex =
          (currentIndex - 1 + windowOrder.length) % windowOrder.length;
        const prevAppId = windowOrder[prevIndex] as AppId;
        get().bringToForeground(prevAppId);
      },
    }),
    {
      name: "ryos:app-store",
      partialize: (state) => ({
        windowOrder: state.windowOrder,
        apps: state.apps,
        debugMode: state.debugMode,
        aiModel: state.aiModel,
        terminalSoundsEnabled: state.terminalSoundsEnabled,
      }),
    }
  )
); 