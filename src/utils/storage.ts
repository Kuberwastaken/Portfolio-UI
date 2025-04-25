import { Soundboard, WindowPosition, WindowSize } from "../types/types";
import { AppManagerState, AppState } from "../apps/base/types";
import { Message } from "ai";
import { getWindowConfig, getMobileWindowSize } from "../config/appRegistry";
import { type ChatRoom, type ChatMessage } from "../types/chat";

interface Document {
  name: string;
  content: string;
  type?: string;
  modifiedAt?: Date;
  size?: number;
}

interface TrashItem {
  name: string;
  content?: string;
  type?: string;
  isDirectory: boolean;
  originalPath: string;
  deletedAt: number;
  modifiedAt?: Date;
  size?: number;
}

export const APP_STORAGE_KEYS = {
  soundboard: {
    BOARDS: "soundboard:boards",
    WINDOW: "soundboard:window",
    SELECTED_DEVICE_ID: "soundboard:selectedDeviceId",
    HAS_SEEN_HELP: "soundboard:hasSeenHelp",
  },
  "internet-explorer": {
    WINDOW: "internet-explorer:window",
    HISTORY: "internet-explorer:history",
    FAVORITES: "internet-explorer:favorites",
    LAST_URL: "internet-explorer:last-url",
    AI_CACHE: "internet-explorer:ai-cache",
  },
  chats: {
    WINDOW: "chats:window",
    MESSAGES: "chats:messages",
    HAS_SEEN_HELP: "chats:hasSeenHelp",
    CHAT_ROOM_USERNAME: "chats:chatRoomUsername",
    LAST_OPENED_ROOM_ID: "chats:lastOpenedRoomId",
    CACHED_ROOMS: "chats:cachedRooms",
    CACHED_ROOM_MESSAGES: "chats:cachedRoomMessages",
    SIDEBAR_VISIBLE: "chats:sidebarVisible",
  },
  textedit: {
    WINDOW: "textedit:window",
    CONTENT: "textedit:content",
    HAS_SEEN_HELP: "textedit:hasSeenHelp",
    LAST_FILE_PATH: "textedit:last-file-path",
  },
  "control-panels": {
    WINDOW: "control-panels:window",
    HAS_SEEN_HELP: "control-panels:hasSeenHelp",
    DESKTOP_VISIBLE: "control-panels:desktop-visible",
    WALLPAPER: "control-panels:wallpaper",
    UI_SOUNDS_ENABLED: "control-panels:ui-sounds-enabled",
    CHAT_SYNTH_ENABLED: "control-panels:chat-synth-enabled",
    TYPING_SYNTH_ENABLED: "control-panels:typing-synth-enabled",
    SYNTH_PRESET: "control-panels:synth-preset",
    HTML_PREVIEW_SPLIT: "control-panels:html-preview-split",
  },
  minesweeper: {
    WINDOW: "minesweeper:window",
    HAS_SEEN_HELP: "minesweeper:hasSeenHelp",
  },
  finder: {
    WINDOW: "finder:window",
    CURRENT_PATH: "finder:current-path",
    DOCUMENTS: "finder:documents",
    IMAGES: "finder:images",
    TRASH: "finder:trash",
  },
  paint: {
    WINDOW: "paint:window" as const,
    HAS_SEEN_HELP: "paint:hasSeenHelp" as const,
    LAST_FILE_PATH: "paint:lastFilePath" as const,
  },
  videos: {
    WINDOW: "videos:window" as const,
    HAS_SEEN_HELP: "videos:hasSeenHelp" as const,
    PLAYLIST: "videos:playlist" as const,
    CURRENT_INDEX: "videos:currentIndex" as const,
    IS_LOOP_ALL: "videos:isLoopAll" as const,
    IS_LOOP_CURRENT: "videos:isLoopCurrent" as const,
    IS_SHUFFLED: "videos:isShuffled" as const,
  },
  pc: {
    WINDOW: "pc:window" as const,
    HAS_SEEN_HELP: "pc:hasSeenHelp" as const,
    SAVE_STATE: "pc:saveState" as const,
    GAMES: "pc:games" as const,
  },
  "photo-booth": {
    WINDOW: "photo-booth:window" as const,
    HAS_SEEN_HELP: "photo-booth:hasSeenHelp" as const,
    PHOTOS: "photo-booth:photos" as const,
  },
  synth: {
    WINDOW: "synth:window" as const,
    HAS_SEEN_HELP: "synth:hasSeenHelp" as const,
    PRESETS: "synth:presets" as const,
    CURRENT_PRESET: "synth:currentPreset" as const,
    LABEL_TYPE: "synth:labelType" as const,
  },
  ipod: {
    WINDOW: "ipod:window" as const,
    HAS_SEEN_HELP: "ipod:hasSeenHelp" as const,
    LIBRARY: "ipod:library" as const,
    CURRENT_INDEX: "ipod:currentIndex" as const,
    IS_LOOP_ALL: "ipod:isLoopAll" as const,
    IS_LOOP_CURRENT: "ipod:isLoopCurrent" as const,
    IS_SHUFFLED: "ipod:isShuffled" as const,
  },
  terminal: {
    WINDOW: "terminal:window" as const,
    HAS_SEEN_HELP: "terminal:hasSeenHelp" as const,
    COMMAND_HISTORY: "terminal:commandHistory" as const,
    CURRENT_PATH: "terminal:currentPath" as const,
  },
} as const;

interface WindowState {
  position: WindowPosition;
  size: WindowSize;
}

export const loadWindowState = (
  appId: keyof typeof APP_STORAGE_KEYS
): WindowState => {
  const key = APP_STORAGE_KEYS[appId].WINDOW;
  const saved = localStorage.getItem(key);
  if (saved) {
    return JSON.parse(saved);
  }

  const isMobile = window.innerWidth < 768;
  const mobileY = 28; // Fixed Y position for mobile to account for menu bar
  const config = getWindowConfig(appId);

  return {
    position: {
      x: isMobile ? 0 : 16 + Object.keys(APP_STORAGE_KEYS).indexOf(appId) * 32,
      y: isMobile
        ? mobileY
        : 40 + Object.keys(APP_STORAGE_KEYS).indexOf(appId) * 20,
    },
    size: isMobile ? getMobileWindowSize(appId) : config.defaultSize,
  };
};

export const saveWindowState = (
  appId: keyof typeof APP_STORAGE_KEYS,
  state: WindowState
): void => {
  const key = APP_STORAGE_KEYS[appId].WINDOW;
  localStorage.setItem(key, JSON.stringify(state));
};

// Add this new helper function to save window position and size together
export const saveWindowPositionAndSize = (
  appId: keyof typeof APP_STORAGE_KEYS,
  position: WindowPosition,
  size: WindowSize
): void => {
  saveWindowState(appId, { position, size });
};

// Soundboard specific storage
export const loadSoundboards = async (): Promise<Soundboard[]> => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.soundboard.BOARDS);
  if (saved) {
    return JSON.parse(saved);
  }

  try {
    const response = await fetch("/soundboards.json");
    const data = await response.json();
    const importedBoards = data.boards || [data];
    const newBoards = importedBoards.map((board: Soundboard) => ({
      ...board,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      slots: board.slots.map((slot) => ({
        audioData: slot.audioData,
        emoji: slot.emoji,
        title: slot.title,
      })),
    }));
    saveSoundboards(newBoards);
    return newBoards;
  } catch (error) {
    console.error("Error loading initial boards:", error);
    const defaultBoard = createDefaultBoard();
    saveSoundboards([defaultBoard]);
    return [defaultBoard];
  }
};

export const saveSoundboards = (boards: Soundboard[]): void => {
  const boardsForStorage = boards.map((board) => ({
    ...board,
    slots: board.slots.map((slot) => ({
      audioData: slot.audioData,
      emoji: slot.emoji,
      title: slot.title,
    })),
  }));
  localStorage.setItem(
    APP_STORAGE_KEYS.soundboard.BOARDS,
    JSON.stringify(boardsForStorage)
  );
};

export const loadSelectedDeviceId = (): string => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS.soundboard.SELECTED_DEVICE_ID) || ""
  );
};

export const saveSelectedDeviceId = (deviceId: string): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.soundboard.SELECTED_DEVICE_ID,
    deviceId
  );
};

export const createDefaultBoard = (): Soundboard => ({
  id: "default",
  name: "New Soundboard",
  slots: Array(9).fill({
    audioData: null,
    emoji: undefined,
    title: undefined,
  }),
});

export const loadHasSeenHelp = (): boolean => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS.soundboard.HAS_SEEN_HELP) === "true"
  );
};

export const saveHasSeenHelp = (): void => {
  localStorage.setItem(APP_STORAGE_KEYS.soundboard.HAS_SEEN_HELP, "true");
};

export interface Favorite {
  title: string;
  url: string;
  favicon?: string;
  year?: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  favicon?: string;
  timestamp: number;
  year?: string;
}

export const DEFAULT_FAVORITES: Favorite[] = [
  {
    title: "Apple",
    url: "https://apple.com",
    favicon: "https://www.google.com/s2/favicons?domain=apple.com&sz=32",
    year: "2007",
  },
  {
    title: "HyperCards",
    url: "https://hcsimulator.com",
    favicon: "https://www.google.com/s2/favicons?domain=hcsimulator.com&sz=32",
    year: "current",
  },
  {
    title: "Baby Cursor",
    url: "https://baby-cursor.ryo.lu",
    favicon: "https://www.google.com/s2/favicons?domain=ryo.lu&sz=32",
    year: "current",
  },
  {
    title: "Notion",
    url: "https://notion.com",
    favicon: "https://www.google.com/s2/favicons?domain=notion.com&sz=32",
    year: "2050",
  },
  {
    title: "Ryo",
    url: "https://ryo.lu",
    favicon: "https://www.google.com/s2/favicons?domain=ryo.lu&sz=32",
    year: "current",
  },
  {
    title: "Ian",
    url: "https://shaoruu.io",
    favicon: "https://www.google.com/s2/favicons?domain=shaoruu.io&sz=32",
    year: "current",
  },
  {
    title: "Sam",
    url: "https://www.samuelcatania.com",
    favicon:
      "https://www.google.com/s2/favicons?domain=www.samuelcatania.com&sz=32",
    year: "current",
  },
  {
    title: "Theo",
    url: "https://tmb.sh",
    favicon: "https://www.google.com/s2/favicons?domain=tmb.sh&sz=32",
    year: "current",
  },
  {
    title: "Stephen",
    url: "https://wustep.me",
    favicon: "https://www.google.com/s2/favicons?domain=wustep.me&sz=32",
    year: "current",
  },
  {
    title: "Maya",
    url: "https://mayabakir.com",
    favicon: "https://www.google.com/s2/favicons?domain=mayabakir.com&sz=32",
    year: "current",
  },
  {
    title: "Modi",
    url: "https://www.akm.io",
    favicon: "https://www.google.com/s2/favicons?domain=www.akm.io&sz=32",
    year: "current",
  },
  {
    title: "Andrew",
    url: "https://www.andrewl.ee",
    favicon: "https://www.google.com/s2/favicons?domain=www.andrewl.ee&sz=32",
    year: "current",
  },  {
    title: "Lucas",
    url: "https://www.lucasn.com",
    favicon: "https://www.google.com/s2/favicons?domain=www.lucasn.com&sz=32",
    year: "current",
  },
  {
    title: "Frank",
    url: "https://okfrank.co",
    favicon: "https://www.google.com/s2/favicons?domain=okfrank.co&sz=32",
    year: "current",
  },
];

export const loadFavorites = (): Favorite[] => {
  const saved = localStorage.getItem(
    APP_STORAGE_KEYS["internet-explorer"].FAVORITES
  );
  return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
};
export const saveFavorites = (favorites: Favorite[]): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["internet-explorer"].FAVORITES,
    JSON.stringify(favorites)
  );
};

const APP_STATE_KEY = "app:state";

interface OldAppState {
  isOpen: boolean;
  position?: { x: number; y: number };
  isForeground?: boolean;
  zIndex?: number;
}

interface OldAppManagerState {
  [appId: string]: OldAppState;
}

export const loadAppState = (): AppManagerState => {
  const saved = localStorage.getItem(APP_STATE_KEY);
  // Initialize with default state for all possible apps
  const defaultState: AppManagerState = {
    windowOrder: [],
    apps: Object.keys(APP_STORAGE_KEYS).reduce(
      (acc, appId) => ({
        ...acc,
        [appId]: { isOpen: false },
      }),
      {} as { [appId: string]: AppState }
    ),
  };

  if (saved) {
    const parsedState = JSON.parse(saved) as
      | OldAppManagerState
      | AppManagerState;
    // Handle migration from old format to new format
    if (!("windowOrder" in parsedState)) {
      const oldState = parsedState as OldAppManagerState;
      return {
        windowOrder: Object.entries(oldState)
          .filter(([, state]) => state.isOpen)
          .sort((a, b) => (a[1].zIndex || 0) - (b[1].zIndex || 0))
          .map(([id]) => id),
        apps: Object.entries(oldState).reduce(
          (acc, [id, state]) => ({
            ...acc,
            [id]: {
              isOpen: state.isOpen,
              position: state.position,
              isForeground: state.isForeground,
            },
          }),
          {} as { [appId: string]: AppState }
        ),
      };
    }
    // Merge saved state with default state
    const newState = parsedState as AppManagerState;
    return {
      windowOrder: newState.windowOrder,
      apps: { ...defaultState.apps, ...newState.apps },
    };
  }
  return defaultState;
};

export const saveAppState = (state: AppManagerState): void => {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
};

// Chat specific storage
export const loadChatMessages = (): Message[] | null => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.chats.MESSAGES);
  if (!saved) return null;
  const messages = JSON.parse(saved);
  return messages.map(
    (msg: Omit<Message, "createdAt"> & { createdAt: string }) => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
    })
  );
};

export const saveChatMessages = (messages: Message[]): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.chats.MESSAGES,
    JSON.stringify(messages)
  );
};

export const DEFAULT_URL = "https://apple.com";
export const DEFAULT_YEAR = "2002";

export const loadLastUrl = (): string => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS["internet-explorer"].LAST_URL) ||
    DEFAULT_URL
  );
};

export const saveLastUrl = (url: string): void => {
  localStorage.setItem(APP_STORAGE_KEYS["internet-explorer"].LAST_URL, url);
};

export const loadHistory = (): HistoryEntry[] => {
  const saved = localStorage.getItem(
    APP_STORAGE_KEYS["internet-explorer"].HISTORY
  );
  return saved ? JSON.parse(saved) : [];
};

export const saveHistory = (history: HistoryEntry[]): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["internet-explorer"].HISTORY,
    JSON.stringify(history)
  );
};

export const addToHistory = (entry: Omit<HistoryEntry, "timestamp">): void => {
  const history = loadHistory();
  const newEntry = { ...entry, timestamp: Date.now() };
  history.unshift(newEntry);
  // Keep only last 100 entries
  saveHistory(history.slice(0, 100));
};

// Add new functions for wayback year
export const loadWaybackYear = (): string => {
  return (
    localStorage.getItem(
      APP_STORAGE_KEYS["internet-explorer"].LAST_URL + ":year"
    ) || DEFAULT_YEAR
  );
};

export const saveWaybackYear = (year: string): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["internet-explorer"].LAST_URL + ":year",
    year
  );
};

// Desktop icon visibility state
const DESKTOP_ICONS_KEY = "desktop:icons";

interface DesktopIconState {
  [appId: string]: {
    visible: boolean;
  };
}

const DEFAULT_DESKTOP_ICONS: DesktopIconState = {
  soundboard: { visible: true },
  "internet-explorer": { visible: true },
  chats: { visible: true },
  textedit: { visible: true },
  "control-panels": { visible: false },
  minesweeper: { visible: true },
  finder: { visible: false },
  paint: { visible: true },
  videos: { visible: true },
};

export const loadDesktopIconState = (): DesktopIconState => {
  const saved = localStorage.getItem("desktop:icons");
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_DESKTOP_ICONS;
};

export const saveDesktopIconState = (state: DesktopIconState): void => {
  localStorage.setItem(DESKTOP_ICONS_KEY, JSON.stringify(state));
};

export const calculateStorageSpace = () => {
  let total = 0;
  let used = 0;

  try {
    // Estimate total space (typical quota is around 10MB)
    total = 10 * 1024 * 1024; // 10MB in bytes

    // Calculate used space
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += value.length * 2; // Multiply by 2 for UTF-16 encoding
        }
      }
    }
  } catch (error) {
    console.error("Error calculating storage space:", error);
  }

  return {
    total,
    used,
    available: total - used,
    percentUsed: Math.round((used / total) * 100),
  };
};

// Add new functions for control panel settings
export const loadWallpaper = (): string => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS["control-panels"].WALLPAPER) ||
    "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/blue_flowers_loop-p42FtjYrf2DMZ8ZlgNR2tWZrCfDuSL.mp4"
  );
};

export const saveWallpaper = (wallpaperUrl: string): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["control-panels"].WALLPAPER,
    wallpaperUrl
  );
};

export const loadUISoundsEnabled = (): boolean => {
  return (
    localStorage.getItem(
      APP_STORAGE_KEYS["control-panels"].UI_SOUNDS_ENABLED
    ) !== "false"
  );
};

export const saveUISoundsEnabled = (enabled: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["control-panels"].UI_SOUNDS_ENABLED,
    enabled.toString()
  );
};

export const loadChatSynthEnabled = (): boolean => {
  return (
    localStorage.getItem(
      APP_STORAGE_KEYS["control-panels"].CHAT_SYNTH_ENABLED
    ) !== "false"
  );
};

export const saveChatSynthEnabled = (enabled: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["control-panels"].CHAT_SYNTH_ENABLED,
    enabled.toString()
  );
};

export const loadTypingSynthEnabled = (): boolean => {
  const value = localStorage.getItem(
    APP_STORAGE_KEYS["control-panels"].TYPING_SYNTH_ENABLED
  );
  return value === "true";
};

export const saveTypingSynthEnabled = (enabled: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["control-panels"].TYPING_SYNTH_ENABLED,
    enabled.toString()
  );
};

export const clearAllAppStates = (): void => {
  // Clear all app-specific storage
  localStorage.removeItem(APP_STORAGE_KEYS.soundboard.BOARDS);
  localStorage.removeItem(APP_STORAGE_KEYS.soundboard.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.soundboard.SELECTED_DEVICE_ID);
  localStorage.removeItem(APP_STORAGE_KEYS.soundboard.HAS_SEEN_HELP);

  localStorage.removeItem(APP_STORAGE_KEYS["internet-explorer"].WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS["internet-explorer"].HISTORY);
  localStorage.removeItem(APP_STORAGE_KEYS["internet-explorer"].FAVORITES);
  localStorage.removeItem(APP_STORAGE_KEYS["internet-explorer"].LAST_URL);

  localStorage.removeItem(APP_STORAGE_KEYS.chats.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.chats.MESSAGES);
  localStorage.removeItem(APP_STORAGE_KEYS.chats.HAS_SEEN_HELP);

  localStorage.removeItem(APP_STORAGE_KEYS.textedit.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.textedit.CONTENT);
  localStorage.removeItem(APP_STORAGE_KEYS.textedit.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.textedit.LAST_FILE_PATH);

  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].DESKTOP_VISIBLE);
  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].WALLPAPER);
  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].UI_SOUNDS_ENABLED);
  localStorage.removeItem(
    APP_STORAGE_KEYS["control-panels"].CHAT_SYNTH_ENABLED
  );
  localStorage.removeItem(
    APP_STORAGE_KEYS["control-panels"].TYPING_SYNTH_ENABLED
  );
  localStorage.removeItem(APP_STORAGE_KEYS["control-panels"].SYNTH_PRESET);
  localStorage.removeItem(
    APP_STORAGE_KEYS["control-panels"].HTML_PREVIEW_SPLIT
  );

  localStorage.removeItem(APP_STORAGE_KEYS.minesweeper.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.minesweeper.HAS_SEEN_HELP);

  localStorage.removeItem(APP_STORAGE_KEYS.finder.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.finder.CURRENT_PATH);
  localStorage.removeItem(APP_STORAGE_KEYS.finder.DOCUMENTS);
  localStorage.removeItem(APP_STORAGE_KEYS.finder.IMAGES);
  localStorage.removeItem(APP_STORAGE_KEYS.finder.TRASH);

  localStorage.removeItem(APP_STORAGE_KEYS.paint.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.paint.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH);

  localStorage.removeItem(APP_STORAGE_KEYS.videos.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.PLAYLIST);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.CURRENT_INDEX);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.IS_LOOP_ALL);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.IS_LOOP_CURRENT);
  localStorage.removeItem(APP_STORAGE_KEYS.videos.IS_SHUFFLED);

  localStorage.removeItem(APP_STORAGE_KEYS.pc.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.pc.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.pc.SAVE_STATE);
  localStorage.removeItem(APP_STORAGE_KEYS.pc.GAMES);

  localStorage.removeItem(APP_STORAGE_KEYS["photo-booth"].WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS["photo-booth"].HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS["photo-booth"].PHOTOS);

  localStorage.removeItem(APP_STORAGE_KEYS.synth.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.synth.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.synth.PRESETS);
  localStorage.removeItem(APP_STORAGE_KEYS.synth.CURRENT_PRESET);
  localStorage.removeItem(APP_STORAGE_KEYS.synth.LABEL_TYPE);

  localStorage.removeItem(APP_STORAGE_KEYS.ipod.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.ipod.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.ipod.CURRENT_INDEX);
  localStorage.removeItem(APP_STORAGE_KEYS.ipod.IS_LOOP_ALL);
  localStorage.removeItem(APP_STORAGE_KEYS.ipod.IS_LOOP_CURRENT);
  localStorage.removeItem(APP_STORAGE_KEYS.ipod.IS_SHUFFLED);

  localStorage.removeItem(APP_STORAGE_KEYS.terminal.WINDOW);
  localStorage.removeItem(APP_STORAGE_KEYS.terminal.HAS_SEEN_HELP);
  localStorage.removeItem(APP_STORAGE_KEYS.terminal.COMMAND_HISTORY);
  localStorage.removeItem(APP_STORAGE_KEYS.terminal.CURRENT_PATH);

  // Clear desktop icon state
  localStorage.removeItem("desktop:icons");

  // Clear app manager state
  localStorage.removeItem("app:state");

  // Clear synth preset
  localStorage.removeItem("synthPreset");

  // Clear display mode
  localStorage.removeItem("displayMode");

  // Clear persisted zustand stores
  // IMPORTANT: Keep this list in sync with stores in @/stores directory
  // This list is used by both clear operations and backup/restore functionality
  localStorage.removeItem("ryos:app-store");     // App window states from useAppStore
  localStorage.removeItem("ryos:videos");        // Video player state from useVideoStore
  localStorage.removeItem("ryos:internet-explorer"); // Browser history from useInternetExplorerStore
  localStorage.removeItem("ryos:ipod");          // Music player state from useIpodStore
  
  // Any new stores that use the persist middleware must be added here
};

const SYNTH_PRESET_KEY = "synthPreset";

export function loadSynthPreset(): string | null {
  return localStorage.getItem(SYNTH_PRESET_KEY);
}

export function saveSynthPreset(preset: string): void {
  localStorage.setItem(SYNTH_PRESET_KEY, preset);
}

export const loadDocuments = (): Document[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.finder.DOCUMENTS);
  if (saved) {
    return JSON.parse(saved);
  }
  return [
    {
      name: "README.md",
      content: `# ryOS\n\nA web-based operating system experience...`,
      type: "markdown",
    },
    {
      name: "Quick Tips.md",
      content: `# Quick Tips\n\n## Using Apps...`,
      type: "markdown",
    },
  ];
};

export const saveDocuments = (docs: Document[]): void => {
  localStorage.setItem(APP_STORAGE_KEYS.finder.DOCUMENTS, JSON.stringify(docs));
};

export const loadImages = (): Document[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.finder.IMAGES);
  return saved ? JSON.parse(saved) : [];
};

export const saveImages = (images: Document[]): void => {
  localStorage.setItem(APP_STORAGE_KEYS.finder.IMAGES, JSON.stringify(images));
};

export const loadTrashItems = (): TrashItem[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.finder.TRASH);
  return saved ? JSON.parse(saved) : [];
};

export const saveTrashItems = (items: TrashItem[]): void => {
  localStorage.setItem(APP_STORAGE_KEYS.finder.TRASH, JSON.stringify(items));
};

// Videos playlist storage
export interface Video {
  id: string;
  url: string;
  title: string;
  artist?: string;
}

export const DEFAULT_VIDEOS: Video[] = [
  {
    id: "In7e1knX7rQ",
    url: "https://www.youtube.com/watch?v=In7e1knX7rQ",
    title: "ETA/MTLA (feat. E SENS 이센스)",
    artist: "NJZ",
  },
  {
    id: "WpqXjRrZqa0",
    url: "https://www.youtube.com/watch?v=WpqXjRrZqa0",
    title: "Cool with You (2025)",
    artist: "NJZ",
  },
  {
    id: "YYyskjq1vSc",
    url: "https://www.youtube.com/watch?v=YYyskjq1vSc",
    title: "New Jeans (2025)",
    artist: "NJZ",
  },
  {
    id: "hgNJ_qy6LCw",
    url: "https://www.youtube.com/watch?v=hgNJ_qy6LCw",
    title: "ASAP",
    artist: "NJZ",
  },
  {
    id: "ZncbtRo7RXs",
    url: "https://www.youtube.com/watch?v=ZncbtRo7RXs",
    title: "Supernatural (Part.1)",
    artist: "NewJeans (뉴진스)",
  },
  {
    id: "FonjL7DQAUQ",
    url: "https://www.youtube.com/watch?v=FonjL7DQAUQ",
    title: "海浪 (Waves)",
    artist: "deca joins",
  },
  {
    id: "Rk6aQvlmsWo",
    url: "https://www.youtube.com/watch?v=Rk6aQvlmsWo",
    title: "Dandelion",
    artist: "grentperez & Ruel",
  },
  {
    id: "DskqpUrvlmw",
    url: "https://www.youtube.com/watch?v=DskqpUrvlmw",
    title: "GPT",
    artist: "STAYC (스테이씨)",
  },
  {
    id: "osNYssIep5w",
    url: "https://www.youtube.com/watch?v=osNYssIep5w",
    title: "Mantra (House Remix)",
    artist: "JENNIE",
  },
  {
    id: "PICpEtPHyZI",
    url: "https://www.youtube.com/watch?v=PICpEtPHyZI",
    title: "Damn Right",
    artist: "JENNIE, Childish Gambino, Kali Uchis",
  },
  {
    id: "kxUA2wwYiME",
    url: "https://www.youtube.com/watch?v=kxUA2wwYiME",
    title: "The Chase",
    artist: "Hearts2Hearts (하츠투하츠)",
  },
  {
    id: "1FNI1i7H1Kc",
    url: "https://www.youtube.com/watch?v=1FNI1i7H1Kc",
    title: "The Chase (R&B Remix)",
    artist: "Hearts2Hearts (하츠투하츠)",
  },
  {
    id: "hJ9Wp3PO3c8",
    url: "https://www.youtube.com/watch?v=hJ9Wp3PO3c8",
    title: "Butterfly",
    artist: "Hearts2Hearts (하츠투하츠)",
  },
  {
    id: "aFrQIJ5cbRc",
    url: "https://www.youtube.com/watch?v=aFrQIJ5cbRc",
    title: "Know About Me",
    artist: "NMIXX",
  },
  {
    id: "z-xfGoabprU",
    url: "https://www.youtube.com/watch?v=z-xfGoabprU",
    title: "BEBE",
    artist: "STAYC (스테이씨)",
  },
];

export const loadPlaylist = (): Video[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.videos.PLAYLIST);
  return saved ? JSON.parse(saved) : DEFAULT_VIDEOS;
};

export const savePlaylist = (playlist: Video[]): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.videos.PLAYLIST,
    JSON.stringify(playlist)
  );
};

export const loadCurrentIndex = (): number => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.videos.CURRENT_INDEX);
  return saved ? parseInt(saved) : 0;
};

export const saveCurrentIndex = (index: number): void => {
  localStorage.setItem(APP_STORAGE_KEYS.videos.CURRENT_INDEX, index.toString());
};

export const loadIsLoopAll = (): boolean => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.videos.IS_LOOP_ALL);
  return saved === null ? true : saved === "true";
};

export const saveIsLoopAll = (isLoopAll: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.videos.IS_LOOP_ALL,
    isLoopAll.toString()
  );
};

export const loadIsLoopCurrent = (): boolean => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS.videos.IS_LOOP_CURRENT) === "true"
  );
};

export const saveIsLoopCurrent = (isLoopCurrent: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.videos.IS_LOOP_CURRENT,
    isLoopCurrent.toString()
  );
};

export const loadIsShuffled = (): boolean => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.videos.IS_SHUFFLED);
  return saved === null ? true : saved === "true";
};

export const saveIsShuffled = (isShuffled: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.videos.IS_SHUFFLED,
    isShuffled.toString()
  );
};

// PC Games storage
export interface Game {
  id: string;
  name: string;
  path: string;
  image: string;
}

const DEFAULT_GAMES: Game[] = [
  {
    id: "doom",
    name: "Doom",
    path: "https://cdn.dos.zone/custom/dos/doom.jsdos",
    image:
      "https://dos.zone/images/containers/assets/backgrounds/doom_1.jpg/4f71dd317326a9a9722bdd9cd2151390.webp",
  },
  {
    id: "simcity2000",
    name: "SimCity 2000",
    path: "https://cdn.dos.zone/original/2X/b/b1ed3b93829bdff0c9062c5642767825dd52baf1.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/4/41f12cbd023b7732e669b6ade8e811bb5e7c28b1.jpeg/082780351bd2601b6da9741b2ed45eed.webp",
  },
  {
    id: "mario",
    name: "Mario & Luigi",
    path: "https://cdn.dos.zone/custom/dos/mario-luigi.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/8/8e82677e3744f3d72049b6a8042412066312198e.png/cf6f1f35180540104cdb09ae7d909ca2.webp",
  },
  {
    id: "ageofempires",
    name: "Age of Empires",
    path: "https://cdn.dos.zone/custom/dos/aoe-nic.jsdos",
    image:
      "https://dos.zone/images/containers/assets/backgrounds/aoe.jpg/8e9b9790eb7b714952713aafc169c802.webp",
  },
  {
    id: "ageofempires2",
    name: "Age of Empires II",
    path: "https://br.cdn.dos.zone/published/br.clfmbm.AgeOfEmpires2eng.jsdos",
    image:
      "https://dos.zone/images/containers/assets/backgrounds/clfmbm.ss_9ccf9acb373b3e26f9e42a053147845561b2c224.1920x1080.jpg/6d8639336a03258300ab31f690f569ba.webp",
  },
  {
    id: "princeofpersia",
    name: "Prince of Persia",
    path: "https://cdn.dos.zone/original/2X/1/1179a7c9e05b1679333ed6db08e7884f6e86c155.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/9/9c5f757776e4e9891e063c3e935889ec857dce92.jpeg/66435bae6f294c35ad3c7de8a48f90cf.webp",
  },
  {
    id: "aladdin",
    name: "Aladdin",
    path: "https://cdn.dos.zone/original/2X/6/64ae157f1baa4317f626ccbc74364d9da87d5558.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/0/0c804843419df5ca544296ed56b41967b0c6a0d9.gif/7847075ce59afcb0c973b259f6e92946.webp",
  },
  {
    id: "oregontrail",
    name: "The Oregon Trail",
    path: "https://cdn.dos.zone/original/2X/5/53e616496b4da1d95136e235ad90c9cc3f3f760d.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/1/1df856616f960f116e21b33a2fa104bd86f6ee33.jpeg/4756dbf35d654c8815b708c03cc0df22.webp",
  },
  {
    id: "commandandconquer",
    name: "Command & Conquer",
    path: "https://cdn.dos.zone/custom/dos/cc_gdi_novid.jsdos",
    image:
      "https://dos.zone/images/http/original/2X/a/ae3116154ac2b9725465dc1fe59fa39507886432.png/7bf1bed5bf22f0a6ecc8c7fb43d74591.webp",
  },
];

export const loadGames = (): Game[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.pc.GAMES);
  return saved ? JSON.parse(saved) : DEFAULT_GAMES;
};

export const saveGames = (games: Game[]): void => {
  localStorage.setItem(APP_STORAGE_KEYS.pc.GAMES, JSON.stringify(games));
};

// Add a new section for runtime state tracking that persists between renders
// Create global state trackers for runtime state
let videoIsPlayingState = false;
let browserCurrentUrlState = "";
let browserCurrentYearState = "";

// Export functions to update the runtime state
export const updateVideoPlayingState = (isPlaying: boolean): void => {
  videoIsPlayingState = isPlaying;
};

export const updateBrowserState = (url: string, year: string): void => {
  browserCurrentUrlState = url;
  browserCurrentYearState = year;
};

// System state helper functions
export interface SystemState {
  openApps: string[];
  foregroundApp: string | null;
  video: {
    currentVideo: Video | null;
    isPlaying: boolean;
    currentIndex: number;
    isLoopAll: boolean;
    isLoopCurrent: boolean;
    isShuffled: boolean;
  };
  browser: {
    currentUrl: string;
    currentYear: string;
    history: HistoryEntry[];
  };
  textEdit: {
    currentFilePath: string | null;
    hasUnsavedChanges: boolean;
  };
}

export const getSystemState = (): SystemState => {
  // Get app state
  const appState = loadAppState();
  const openApps = appState.windowOrder;
  const foregroundApp =
    Object.entries(appState.apps).find(
      ([, state]) => state.isForeground
    )?.[0] || null;

  // Get video state
  const playlist = loadPlaylist();
  const currentIndex = loadCurrentIndex();
  const currentVideo = playlist[currentIndex] || null;

  // Get browser state - use runtime state if available, otherwise fallback to storage
  const currentUrl = browserCurrentUrlState || loadLastUrl();
  const currentYear = browserCurrentYearState || loadWaybackYear();
  const history = loadHistory();

  // Get TextEdit state
  const textEditFilePath = localStorage.getItem(
    APP_STORAGE_KEYS.textedit.LAST_FILE_PATH
  );
  const textEditContent = localStorage.getItem(
    APP_STORAGE_KEYS.textedit.CONTENT
  );
  const hasUnsavedChanges = Boolean(textEditContent && !textEditFilePath);

  return {
    openApps,
    foregroundApp,
    video: {
      currentVideo,
      isPlaying: videoIsPlayingState, // Use the live state instead of hardcoded false
      currentIndex,
      isLoopAll: loadIsLoopAll(),
      isLoopCurrent: loadIsLoopCurrent(),
      isShuffled: loadIsShuffled(),
    },
    browser: {
      currentUrl,
      currentYear,
      history,
    },
    textEdit: {
      currentFilePath: textEditFilePath,
      hasUnsavedChanges,
    },
  };
};

// Helper function to check if an app is currently open
export const isAppOpen = (appId: keyof typeof APP_STORAGE_KEYS): boolean => {
  const appState = loadAppState();
  return appState.apps[appId]?.isOpen || false;
};

// Helper function to check if an app is in the foreground
export const isAppInForeground = (
  appId: keyof typeof APP_STORAGE_KEYS
): boolean => {
  const appState = loadAppState();
  return appState.apps[appId]?.isForeground || false;
};

// Helper function to get current video playback info
export const getCurrentVideoInfo = () => {
  const playlist = loadPlaylist();
  const currentIndex = loadCurrentIndex();
  return {
    currentVideo: playlist[currentIndex] || null,
    isLoopAll: loadIsLoopAll(),
    isLoopCurrent: loadIsLoopCurrent(),
    isShuffled: loadIsShuffled(),
  };
};

// Helper function to get current browser state
export const getCurrentBrowserState = () => {
  return {
    currentUrl: loadLastUrl(),
    currentYear: loadWaybackYear(),
    history: loadHistory(),
  };
};

// Synth app storage
export interface SynthPreset {
  id: string;
  name: string;
  oscillator: {
    type: "sine" | "square" | "triangle" | "sawtooth";
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  effects: {
    reverb: number;
    delay: number;
    distortion: number;
    gain: number;
    chorus?: number;
    phaser?: number;
    bitcrusher?: number;
  };
}

export const loadSynthPresets = (): SynthPreset[] => {
  const presets = localStorage.getItem(APP_STORAGE_KEYS.synth.PRESETS);
  if (!presets) return [];
  try {
    const parsedPresets = JSON.parse(presets) as SynthPreset[];
    // Handle backward compatibility with older presets
    return parsedPresets.map((preset) => ({
      ...preset,
      effects: {
        ...preset.effects,
        chorus: preset.effects.chorus ?? 0,
        phaser: preset.effects.phaser ?? 0,
        bitcrusher: preset.effects.bitcrusher ?? 0,
      },
    }));
  } catch {
    return [];
  }
};

export const saveSynthPresets = (presets: SynthPreset[]): void => {
  localStorage.setItem(APP_STORAGE_KEYS.synth.PRESETS, JSON.stringify(presets));
};

export const loadSynthCurrentPreset = (): SynthPreset | null => {
  const preset = localStorage.getItem(APP_STORAGE_KEYS.synth.CURRENT_PRESET);
  if (!preset) return null;
  try {
    const parsedPreset = JSON.parse(preset) as SynthPreset;
    // Handle backward compatibility
    return {
      ...parsedPreset,
      effects: {
        ...parsedPreset.effects,
        chorus: parsedPreset.effects.chorus ?? 0,
        phaser: parsedPreset.effects.phaser ?? 0,
        bitcrusher: parsedPreset.effects.bitcrusher ?? 0,
      },
    };
  } catch {
    return null;
  }
};

export const saveSynthCurrentPreset = (preset: SynthPreset): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.synth.CURRENT_PRESET,
    JSON.stringify(preset)
  );
};

// Add these new functions near the other synth storage functions
export const loadSynthLabelType = (): "note" | "key" | "off" => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.synth.LABEL_TYPE);
  return (saved as "note" | "key" | "off") || "key";
};

export const saveSynthLabelType = (labelType: "note" | "key" | "off"): void => {
  localStorage.setItem(APP_STORAGE_KEYS.synth.LABEL_TYPE, labelType);
};

// iPod library storage
export interface Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  album?: string;
}

export const loadLibrary = (): Track[] => {
  // Use the videos playlist instead of separate storage
  const videoPlaylist = loadPlaylist();

  // Convert Video objects to Track objects
  return videoPlaylist.map((video) => {
    // If video already has an artist field, use it
    if (video.artist) {
      // Extract just the title part (remove artist prefix if present)
      let title = video.title;
      if (video.title.startsWith(video.artist + " - ")) {
        title = video.title.substring(video.artist.length + 3);
      }

      return {
        id: video.id,
        url: video.url,
        title: title,
        artist: video.artist,
        album: "Shared Playlist",
      };
    }
    // Otherwise, extract artist and title from the title field
    else {
      // Extract artist and title parts
      const splitTitle = video.title.split(" - ");
      let artist = undefined;
      let title = video.title;

      if (splitTitle.length > 1) {
        artist = splitTitle[0];
        // Join the rest of the parts in case there are multiple dashes
        title = splitTitle.slice(1).join(" - ");
      }

      return {
        id: video.id,
        url: video.url,
        title: title,
        artist: artist,
        album: "Shared Playlist",
      };
    }
  });
};

export const saveLibrary = (library: Track[]): void => {
  // Convert Track objects back to Video objects and save to videos playlist
  const videoPlaylist = library.map((track) => {
    // Save artist and title separately, consistent with Video interface
    return {
      id: track.id,
      url: track.url,
      title: track.title, // Use the track's title directly
      artist: track.artist, // Save the artist if available
    };
  });

  savePlaylist(videoPlaylist);
};

export const loadIpodCurrentIndex = (): number => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.ipod.CURRENT_INDEX);
  return saved ? parseInt(saved) : 0;
};

export const saveIpodCurrentIndex = (index: number): void => {
  localStorage.setItem(APP_STORAGE_KEYS.ipod.CURRENT_INDEX, index.toString());
};

export const loadIpodIsLoopAll = (): boolean => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.ipod.IS_LOOP_ALL);
  return saved === null ? true : saved === "true";
};

export const saveIpodIsLoopAll = (isLoopAll: boolean): void => {
  localStorage.setItem(APP_STORAGE_KEYS.ipod.IS_LOOP_ALL, isLoopAll.toString());
};

export const loadIpodIsLoopCurrent = (): boolean => {
  return localStorage.getItem(APP_STORAGE_KEYS.ipod.IS_LOOP_CURRENT) === "true";
};

export const saveIpodIsLoopCurrent = (isLoopCurrent: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.ipod.IS_LOOP_CURRENT,
    isLoopCurrent.toString()
  );
};

export const loadIpodIsShuffled = (): boolean => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.ipod.IS_SHUFFLED);
  return saved === null ? false : saved === "true";
};

export const saveIpodIsShuffled = (isShuffled: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.ipod.IS_SHUFFLED,
    isShuffled.toString()
  );
};

// Terminal command history storage
export interface TerminalCommand {
  command: string;
  timestamp: number;
}

export const loadTerminalCommandHistory = (): TerminalCommand[] => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.terminal.COMMAND_HISTORY);
  return saved ? JSON.parse(saved) : [];
};

export const saveTerminalCommandHistory = (
  commands: TerminalCommand[]
): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.terminal.COMMAND_HISTORY,
    JSON.stringify(commands.slice(-100)) // Keep only the last 100 commands
  );
};

export const addTerminalCommand = (command: string): void => {
  const history = loadTerminalCommandHistory();
  const newCommand: TerminalCommand = {
    command,
    timestamp: Date.now(),
  };
  history.push(newCommand);
  saveTerminalCommandHistory(history);
};

export const loadTerminalCurrentPath = (): string => {
  return localStorage.getItem(APP_STORAGE_KEYS.terminal.CURRENT_PATH) || "/";
};

export const saveTerminalCurrentPath = (path: string): void => {
  localStorage.setItem(APP_STORAGE_KEYS.terminal.CURRENT_PATH, path);
};

// Add these new functions near the other control panel storage functions
export const loadHtmlPreviewSplit = (): boolean => {
  const saved = localStorage.getItem(
    APP_STORAGE_KEYS["control-panels"].HTML_PREVIEW_SPLIT
  );
  return saved === null ? true : saved === "true"; // Default to true
};

export const saveHtmlPreviewSplit = (isSplit: boolean): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS["control-panels"].HTML_PREVIEW_SPLIT,
    isSplit.toString()
  );
};

// Add functions for chat sidebar visibility
export const loadChatSidebarVisible = (): boolean => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.chats.SIDEBAR_VISIBLE);
  console.log("[Storage] Loading chat sidebar visibility:", saved);
  // Default to true if not set
  const isVisible = saved === null ? true : saved === "true";
  console.log("[Storage] Parsed visibility:", isVisible);
  return isVisible;
};

export const saveChatSidebarVisible = (isVisible: boolean): void => {
  console.log("[Storage] Saving chat sidebar visibility:", isVisible);
  localStorage.setItem(
    APP_STORAGE_KEYS.chats.SIDEBAR_VISIBLE,
    isVisible.toString()
  );
};

// Add these constants for IndexedDB at the end of the file
const DB_NAME = "ryOS";
const DB_VERSION = 3;
const STORES = {
  DOCUMENTS: "documents",
  IMAGES: "images",
  TRASH: "trash",
  CUSTOM_WALLPAPERS: "custom_wallpapers",
};

// Function to ensure IndexedDB is initialized with all required stores
export const ensureIndexedDBInitialized = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      // Check if all required stores exist
      const missingStores = Object.values(STORES).filter(
        (store) => !db.objectStoreNames.contains(store)
      );

      if (missingStores.length > 0) {
        // Close the database so we can upgrade it
        db.close();
        // Increment version to trigger onupgradeneeded
        const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1);

        upgradeRequest.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create missing stores
          missingStores.forEach((store) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: "name" });
              console.log(`Created missing store: ${store}`);
            }
          });
        };

        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
        upgradeRequest.onerror = () => reject(upgradeRequest.error);
      } else {
        resolve(db);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      Object.values(STORES).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "name" });
        }
      });
    };
  });
};

// Chat room user storage
export const loadChatRoomUsername = (): string | null => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS.chats.CHAT_ROOM_USERNAME) || null
  );
};

export const saveChatRoomUsername = (username: string): void => {
  localStorage.setItem(APP_STORAGE_KEYS.chats.CHAT_ROOM_USERNAME, username);
};

// Add functions for loading and saving the last opened room ID
export const loadLastOpenedRoomId = (): string | null => {
  return (
    localStorage.getItem(APP_STORAGE_KEYS.chats.LAST_OPENED_ROOM_ID) || null
  );
};

export const saveLastOpenedRoomId = (roomId: string | null): void => {
  if (roomId) {
    localStorage.setItem(APP_STORAGE_KEYS.chats.LAST_OPENED_ROOM_ID, roomId);
  } else {
    // Remove the item if the ID is null (e.g., user selected Ryo chat)
    localStorage.removeItem(APP_STORAGE_KEYS.chats.LAST_OPENED_ROOM_ID);
  }
};

// Add functions for loading and saving cached chat rooms
export const loadCachedChatRooms = (): ChatRoom[] | null => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.chats.CACHED_ROOMS);
  return saved ? JSON.parse(saved) : null;
};

export const saveCachedChatRooms = (rooms: ChatRoom[]): void => {
  localStorage.setItem(
    APP_STORAGE_KEYS.chats.CACHED_ROOMS,
    JSON.stringify(rooms)
  );
};

// Add functions for caching individual room messages
export const loadCachedRoomMessages = (
  roomId: string
): ChatMessage[] | null => {
  const saved = localStorage.getItem(
    APP_STORAGE_KEYS.chats.CACHED_ROOM_MESSAGES
  );
  if (!saved) return null;

  try {
    const allCachedMessages: Record<string, ChatMessage[]> = JSON.parse(saved);
    // Timestamps are stored as numbers, so they should be directly usable.
    return allCachedMessages[roomId] || null;
  } catch (error) {
    console.error(`Error loading cached messages for room ${roomId}:`, error);
    return null;
  }
};

export const saveRoomMessagesToCache = (
  roomId: string,
  messages: ChatMessage[]
): void => {
  const saved = localStorage.getItem(
    APP_STORAGE_KEYS.chats.CACHED_ROOM_MESSAGES
  );
  let allCachedMessages: Record<string, ChatMessage[]> = {};

  if (saved) {
    try {
      allCachedMessages = JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing existing cached room messages:", error);
      allCachedMessages = {};
    }
  }

  // Update messages - assumes timestamp is already a number
  allCachedMessages[roomId] = messages;

  try {
    localStorage.setItem(
      APP_STORAGE_KEYS.chats.CACHED_ROOM_MESSAGES,
      JSON.stringify(allCachedMessages)
    );
  } catch (error) {
    console.error(`Error saving cached messages for room ${roomId}:`, error);
  }
};

export const loadAiPageCache = (): Record<string, { html: string; updatedAt: number }> => {
  const saved = localStorage.getItem(APP_STORAGE_KEYS["internet-explorer"].AI_CACHE);
  return saved ? JSON.parse(saved) : {};
};

export const saveAiPageCache = (cache: Record<string, { html: string; updatedAt: number }>): void => {
  try {
    localStorage.setItem(
      APP_STORAGE_KEYS["internet-explorer"].AI_CACHE,
      JSON.stringify(cache)
    );
  } catch (err) {
    // Potentially quota exceeded; consider clearing older entries.
    console.warn("Failed to save AI cache", err);
  }
};

// Helper to generate cache key from URL and year
export const getAiCacheKey = (url: string, year: string): string => {
  // Normalize URL to ensure consistency (remove trailing slash, ensure protocol)
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  return `${normalizedUrl}|${year}`;
};

export const loadCachedAiPage = (url: string, year: string): string | null => {
  const cache = loadAiPageCache();
  const key = getAiCacheKey(url, year);
  return cache[key]?.html || null;
};

export const saveCachedAiPage = (url: string, year: string, html: string): void => {
  const cache = loadAiPageCache();
  const key = getAiCacheKey(url, year);
  cache[key] = { html, updatedAt: Date.now() };
  saveAiPageCache(cache);
};
