import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define types
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

export type NavigationMode = "past" | "now" | "future";
export type NavigationStatus = "idle" | "loading" | "success" | "error";

// Default constants
export const DEFAULT_URL = "https://apple.com";
export const DEFAULT_YEAR = "2003";

export const DEFAULT_TIMELINE: { [year: string]: string } = {
  "2030": "FDA neural implants. Emotion wearables mainstream. CRISPR prime+base. Organ-print trials. Alzheimer halt drug. Neuralink-v5 patients. Net-positive fusion demo.",
  "2040": "AI city governance. Quantum-profit compute. Desktop molecular printers. Smart-dust logistics. Neuromorphic cores. Tactile-holo rooms. Life+20 gene edits. Cancer cured. Orbital-solar farms.",
  "2050": "Cloud mind-backups. Digital-heir laws. Sentient-AI rights fight. Medical neural-dust. Photoreal AR lenses. Designer embryos. Age-decel commonplace. Fusion grids dominant.",
  "2060": "Human-AI merge wave. Symbiont organs stock. Quantum neural mesh. Home matter assembler. Age reversal < 40. 150-yr median lives. Zero-carbon fusion grid.",
  "2070": "Post-scarcity UBI. Auto fab-cities. Climate healed. Ocean revival. Terraform Moon & Mars. Asteroid-mining boom.",
  "2080": "Daily uploads. Hive-mind trials. Synth-reality on demand. Femtotech labs. Quantum-teleport cargo. Genome rewrite opt-in. Rental avatars. Bio-immortality near.",
  "2090": "QC standard. Home molecular-fab. Nanomed auto-repair. Seamless brain-cloud. Space elevator. Orbital ring. Dyson-swarm phase-1. Mars tera-phase-2. Venus cloud cities.",
  "2100": "Planet mind-net. Supra-AI council. Subatomic chips. Probability-hack toys. Space-adapted clades. Dyson complete. Generation ships depart.",
  "2150": "Solar mind-mesh. Substrate-free selves. Vacuum computing. Reality-script APIs. Zero-point norm. FTL entangle chat. Stable micro-wormholes.",
  "2200": "Fluid minds. Shape-shift avatars. Hyperspace thought. Exotic compute lattices. Dimensional forging. Star-lifting works. Teleport loops.",
  "2250": "Stars reached. Exoplanet colonies. Alien microbe meet. Universal translator. Galaxy entangle-net. Anti-dilate meds.",
  "2300": "Opt-in hives. Reality-architect guilds. Pocket universes. Dark-matter biotech. Tame micro-black holes. 50+ colonized systems.",
  "2400": "Galactic grid mature. Multi-species federation. Stellar gardening. Planet sculpting. Culture hyper-exchange.",
  "2500": "Meta-singularity era. Transcendent minds. Constant tuning. Multiverse portals. Conscious nebulae. Galaxy infosphere.",
  "2750": "Inter-galactic leap. Dyson-cluster swarms. Higher-D labs. Time-canal experiments. Cosmic AI overseer.",
  "3000": "Omniverse civilization. Plastic physics. Infinite realms. Boundless cognition."
};

export const DEFAULT_FAVORITES: Favorite[] = [
  {
    title: "Apple",
    url: "https://apple.com",
    favicon: "https://www.google.com/s2/favicons?domain=apple.com&sz=32",
    year: "2003",
  },

  {
    title: "Wikipedia",
    url: "https://en.wikipedia.org",
    favicon: "https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=32",
    year: "current",
  },

  {
    title: "NYTimes",
    url: "https://nytimes.com",
    favicon: "https://www.google.com/s2/favicons?domain=nytimes.com&sz=32",
    year: "current",
  },
  {
    title: "NewJeans",
    url: "https://newjeans.jp",
    favicon: "https://www.google.com/s2/favicons?domain=newjeans.jp&sz=32",
    year: "current",
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
  },  
  {
    title: "Lucas",
    url: "https://www.lucasn.com",
    favicon: "https://www.google.com/s2/favicons?domain=www.lucasn.com&sz=32",
    year: "current",
  }
];

// Helper function to classify year into navigation mode
function classifyYear(year: string): NavigationMode {
  if (year === "current") return "now";
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  return yearNum > currentYear ? "future" : "past";
}

// Cache related types and functions
interface AiCacheEntry {
  html: string;
  updatedAt: number;
  title?: string;
}

// Define type for iframe check response (copied from component)
/*
interface IframeCheckResponse {
  allowed: boolean;
  reason?: string;
  title?: string;
}
*/

// Define type for error response (copied from component)
export interface ErrorResponse { // Make exportable if needed elsewhere
  error: boolean;
  type: string;
  status?: number;
  statusText?: string;
  message: string;
  details?: string;
  hostname?: string;
  targetUrl?: string;
}

interface InternetExplorerStore {
  // Navigation state
  url: string;
  year: string;
  mode: NavigationMode;
  status: NavigationStatus;
  finalUrl: string | null;
  aiGeneratedHtml: string | null;
  error: string | null; // Keep simple error string for general errors? Or remove if errorDetails covers all? Let's keep for now.
  token: number;
  prefetchedTitle: string | null; // New: Store prefetched title
  errorDetails: ErrorResponse | null; // New: Store detailed error info
  
  // Favorites and history
  favorites: Favorite[];
  history: HistoryEntry[];
  historyIndex: number;
  
  // Dialog states
  isTitleDialogOpen: boolean;
  newFavoriteTitle: string;
  isHelpDialogOpen: boolean;
  isAboutDialogOpen: boolean;
  isNavigatingHistory: boolean;
  isClearFavoritesDialogOpen: boolean;
  isClearHistoryDialogOpen: boolean;
  isResetFavoritesDialogOpen: boolean; // New
  isFutureSettingsDialogOpen: boolean; // New
  
  // AI caching
  aiCache: Record<string, AiCacheEntry>;
  
  // Timeline settings
  timelineSettings: { [year: string]: string };
  
  // Title management
  currentPageTitle: string | null;
  
  // Actions
  setUrl: (url: string) => void;
  setYear: (year: string) => void;
  navigateStart: (url: string, year: string, mode: NavigationMode, token: number) => void;
  setFinalUrl: (finalUrl: string) => void;
  loadSuccess: (payload: { 
    title?: string | null;
    finalUrl?: string; 
    aiGeneratedHtml?: string | null;
    targetUrl?: string; // Renamed from url in payload for clarity
    targetYear?: string; // Renamed from year for clarity
    favicon?: string;
    addToHistory?: boolean;
  }) => void;
  loadError: (error: string, errorDetails?: ErrorResponse) => void; // Modified to accept optional errorDetails
  cancel: () => void;
  handleNavigationError: (errorData: ErrorResponse, targetUrlOnError: string) => void; // New action for specific error handling
  
  // Favorites actions
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (index: number) => void;
  clearFavorites: () => void;
  
  // History actions
  setHistoryIndex: (index: number) => void;
  clearHistory: () => void;
  
  // Dialog actions
  setTitleDialogOpen: (isOpen: boolean) => void;
  setNewFavoriteTitle: (title: string) => void;
  setHelpDialogOpen: (isOpen: boolean) => void;
  setAboutDialogOpen: (isOpen: boolean) => void;
  setNavigatingHistory: (isNavigating: boolean) => void;
  setClearFavoritesDialogOpen: (isOpen: boolean) => void;
  setClearHistoryDialogOpen: (isOpen: boolean) => void;
  setResetFavoritesDialogOpen: (isOpen: boolean) => void; // New
  setFutureSettingsDialogOpen: (isOpen: boolean) => void; // New
  
  // Cache actions
  cacheAiPage: (url: string, year: string, html: string, title?: string) => void;
  getCachedAiPage: (url: string, year: string) => AiCacheEntry | null;
  
  // Timeline actions
  setTimelineSettings: (settings: { [year: string]: string }) => void;
  
  // Title management action
  setCurrentPageTitle: (title: string | null) => void;
  
  // Prefetched title action
  setPrefetchedTitle: (title: string | null) => void; // New
  
  // Error details actions
  setErrorDetails: (details: ErrorResponse | null) => void; // New
  clearErrorDetails: () => void; // New specific action
  
  // Utility functions
  getAiCacheKey: (url: string, year: string) => string;
  updateBrowserState: () => void;
}

// Helper function to get hostname (copied from component)
const getHostname = (targetUrl: string): string => {
  try {
    return new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname;
  } catch {
    return targetUrl; // Return the target URL itself if it can't be parsed
  }
};

export const useInternetExplorerStore = create<InternetExplorerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      url: DEFAULT_URL,
      year: DEFAULT_YEAR,
      mode: classifyYear(DEFAULT_YEAR),
      status: 'idle',
      finalUrl: null,
      aiGeneratedHtml: null,
      error: null,
      token: 0,
      prefetchedTitle: null, // New initial state
      errorDetails: null, // New initial state
      
      favorites: DEFAULT_FAVORITES,
      history: [],
      historyIndex: -1,
      
      isTitleDialogOpen: false,
      newFavoriteTitle: "",
      isHelpDialogOpen: false,
      isAboutDialogOpen: false,
      isNavigatingHistory: false,
      isClearFavoritesDialogOpen: false,
      isClearHistoryDialogOpen: false,
      isResetFavoritesDialogOpen: false, // New initial state
      isFutureSettingsDialogOpen: false, // New initial state
      
      aiCache: {},
      
      timelineSettings: {},
      
      currentPageTitle: null,
      
      // Actions
      setUrl: (url) => set({ url }),
      
      setYear: (year) => set({ year }),
      
      navigateStart: (url, year, mode, token) => set({
        url,
        year,
        mode,
        status: 'loading',
        finalUrl: null,
        aiGeneratedHtml: null,
        error: null,
        token,
        currentPageTitle: null,
        errorDetails: null, // Reset error details on new navigation
        prefetchedTitle: null, // Reset prefetched title
      }),
      
      setFinalUrl: (finalUrl) => set({ finalUrl }),
      
      loadSuccess: ({ title, finalUrl, aiGeneratedHtml, targetUrl, targetYear, favicon, addToHistory = true }) => set(state => {
        const newState: Partial<InternetExplorerStore> = {
          status: 'success',
          error: null, // Clear simple error
          errorDetails: null, // Clear detailed error
          // Use prefetched title if title payload is undefined, otherwise use payload title
          currentPageTitle: title !== undefined ? title : state.prefetchedTitle,
          finalUrl: finalUrl ?? state.finalUrl,
          aiGeneratedHtml: aiGeneratedHtml ?? state.aiGeneratedHtml,
          prefetchedTitle: null, // Clear prefetched title after use
        };

        // History management
        if (addToHistory && targetUrl) {
          const historyTitle = newState.currentPageTitle || getHostname(targetUrl);
          const newEntry: HistoryEntry = { 
            url: targetUrl, 
            title: historyTitle, 
            favicon: favicon || `https://www.google.com/s2/favicons?domain=${getHostname(targetUrl)}&sz=32`, 
            year: targetYear,
            timestamp: Date.now() 
          };
          
          if (state.isNavigatingHistory) {
            // If navigating through history (back/forward), just update title if needed
            const lastEntry = state.history[state.historyIndex];
            if (lastEntry && lastEntry.title !== newEntry.title) {
              // Update title of the current entry if it changed
              const updatedHistory = [...state.history];
              updatedHistory[state.historyIndex] = { ...lastEntry, title: newEntry.title };
              newState.history = updatedHistory;
              newState.historyIndex = state.historyIndex; // Keep index same
            }
          } else {
            // Check if this is an exact duplicate of the most recent history entry
            const mostRecentEntry = state.history[0];
            const isExactDuplicate = mostRecentEntry && 
                                    mostRecentEntry.url === newEntry.url && 
                                    mostRecentEntry.year === newEntry.year;
            
            if (isExactDuplicate) {
              // If it's an exact duplicate, just update the title if needed
              if (mostRecentEntry.title !== newEntry.title) {
                const updatedHistory = [...state.history];
                updatedHistory[0] = { ...mostRecentEntry, title: newEntry.title };
                newState.history = updatedHistory;
              }
              newState.historyIndex = 0; // Maintain current index
            } else {
              // Always add a new entry at the beginning of history
              newState.history = [newEntry, ...state.history].slice(0, 100); // Limit history size
              newState.historyIndex = 0;
            }
          }
        } else if (!addToHistory) {
          // If explicitly not adding to history (like during back/forward), just keep index
          newState.historyIndex = state.historyIndex;
        }

        // Call updateBrowserState logic
        get().updateBrowserState();

        return newState;
      }),
      
      // Keep simple error for now, but set detailed error if provided
      loadError: (error, errorDetails) => set({
        status: 'error',
        error,
        errorDetails: errorDetails ?? null // Set detailed error if available
      }),
      
      // New action to handle specific errors and set detailed info
      handleNavigationError: (errorData, targetUrlOnError) => set(() => {
        const newErrorDetails: ErrorResponse = {
          ...errorData,
          targetUrl: targetUrlOnError, // Ensure target URL is set
          hostname: getHostname(targetUrlOnError) // Ensure hostname is set
        };
        return {
          status: 'error',
          error: newErrorDetails.message.split('.')[0] || 'Navigation Error', // Set simple error from message
          errorDetails: newErrorDetails, // Set detailed error object
          aiGeneratedHtml: null, // Clear any partial AI HTML
        };
      }),
      
      cancel: () => set({ status: 'idle', errorDetails: null }), // Clear error details on cancel
      
      // Favorites actions
      addFavorite: (favorite) => set(state => ({
        favorites: [...state.favorites, favorite],
      })),
      
      removeFavorite: (index) => set(state => ({
        favorites: state.favorites.filter((_, i) => i !== index),
      })),
      
      clearFavorites: () => set({ favorites: [] }),
      
      // History actions
      setHistoryIndex: (index) => set({ historyIndex: index }),
      
      clearHistory: () => set({ history: [], historyIndex: -1 }),
      
      // Dialog actions
      setTitleDialogOpen: (isOpen) => set({ isTitleDialogOpen: isOpen }),
      setNewFavoriteTitle: (title) => set({ newFavoriteTitle: title }),
      setHelpDialogOpen: (isOpen) => set({ isHelpDialogOpen: isOpen }),
      setAboutDialogOpen: (isOpen) => set({ isAboutDialogOpen: isOpen }),
      setNavigatingHistory: (isNavigating) => set({ isNavigatingHistory: isNavigating }),
      setClearFavoritesDialogOpen: (isOpen) => set({ isClearFavoritesDialogOpen: isOpen }),
      setClearHistoryDialogOpen: (isOpen) => set({ isClearHistoryDialogOpen: isOpen }),
      setResetFavoritesDialogOpen: (isOpen) => set({ isResetFavoritesDialogOpen: isOpen }), // New
      setFutureSettingsDialogOpen: (isOpen) => set({ isFutureSettingsDialogOpen: isOpen }), // New
      
      // Cache actions
      getAiCacheKey: (url, year) => {
        const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
        try {
          // More robust normalization: handle ports, remove trailing slash, lowercase hostname
          const parsed = new URL(normalizedUrl);
          parsed.pathname = parsed.pathname.replace(/\/$/, ''); // Remove trailing slash
          parsed.hostname = parsed.hostname.toLowerCase();
          // Keep common ports (80, 443) implicit, include others
          const portString = (parsed.port && parsed.port !== '80' && parsed.port !== '443') ? `:${parsed.port}` : '';
          return `${parsed.protocol}//${parsed.hostname}${portString}${parsed.pathname}${parsed.search}${parsed.hash}|${year}`;
        } catch {
          // Fallback for invalid URLs
          return `${normalizedUrl}|${year}`;
        }
      },
      
      cacheAiPage: (url, year, html, title) => set(state => {
        const key = get().getAiCacheKey(url, year);
        return {
          aiCache: {
            ...state.aiCache,
            [key]: { html, title, updatedAt: Date.now() }
          }
        };
      }),
      
      getCachedAiPage: (url, year) => {
        const key = get().getAiCacheKey(url, year);
        return get().aiCache[key] || null;
      },
      
      // Timeline actions
      setTimelineSettings: (settings) => set({ timelineSettings: settings }),
      
      // Title management action
      setCurrentPageTitle: (title) => set({ currentPageTitle: title }),
      
      // Prefetched title action
      setPrefetchedTitle: (title) => set({ prefetchedTitle: title }), // New
      
      // Error details actions
      setErrorDetails: (details) => set({ errorDetails: details }), // New
      clearErrorDetails: () => set({ errorDetails: null, error: null }), // New, also clear simple error
      
      // Update system browser state
      updateBrowserState: () => {
        // Stub remains empty, actual state is readable from the store
      }
    }),
    {
      name: "ryos:internet-explorer",
      partialize: (state) => ({
        url: state.url,
        year: state.year,
        favorites: state.favorites,
        history: state.history.slice(0, 50), // Limit persisted history size further
        aiCache: state.aiCache, // Consider limiting cache size too if it grows large
        timelineSettings: state.timelineSettings,
        // Don't persist transient state like dialogs, errorDetails, prefetchedTitle
      }),
    }
  )
); 