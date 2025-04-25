import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_VIDEOS } from "./useVideoStore"; // Import default videos

// Define the Track type (can be shared or defined here)
export interface Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  album?: string;
}

// Map default videos to tracks for the initial iPod state
const DEFAULT_TRACKS: Track[] = DEFAULT_VIDEOS.map((video) => ({
  id: video.id,
  url: video.url,
  title: video.title,
  artist: video.artist,
  album: "Shared Playlist", // Add a default album or leave undefined
}));

interface IpodStoreState {
  tracks: Track[];
  originalOrder: Track[]; // Store the original order for unshuffling
  currentIndex: number;
  loopAll: boolean;
  loopCurrent: boolean;
  isShuffled: boolean;
  isPlaying: boolean;
  showVideo: boolean;
  backlightOn: boolean;
  theme: string; // 'classic' or 'black'
  lcdFilterOn: boolean;
  // actions
  setTracks: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  toggleLoopAll: () => void;
  toggleLoopCurrent: () => void;
  toggleShuffle: () => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
  toggleVideo: () => void;
  toggleBacklight: () => void;
  setTheme: (theme: string) => void;
  toggleLcdFilter: () => void;
  addTrack: (track: Track) => void;
  clearLibrary: () => void;
  resetLibrary: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

export const useIpodStore = create<IpodStoreState>()(
  persist(
    (set, get) => ({
      tracks: DEFAULT_TRACKS,
      originalOrder: DEFAULT_TRACKS, // Initialize original order
      currentIndex: 0,
      loopAll: true, // Default loop all to true
      loopCurrent: false,
      isShuffled: true, // Default shuffle to true
      isPlaying: false,
      showVideo: false,
      backlightOn: true, // Default backlight to on
      theme: "classic", // Default theme
      lcdFilterOn: true, // Default LCD filter to on
      // --- Actions ---
      setTracks: (tracks) => set({ tracks }), // Basic setter, might need adjustment for originalOrder
      setCurrentIndex: (index) => set({ currentIndex: index }),
      toggleLoopAll: () =>
        set((state) => ({ loopAll: !state.loopAll, loopCurrent: false })), // Ensure only one loop mode active
      toggleLoopCurrent: () =>
        set((state) => ({ loopCurrent: !state.loopCurrent, loopAll: false })), // Ensure only one loop mode active
      toggleShuffle: () => {
        const currentIsShuffled = get().isShuffled;
        const currentOriginalOrder = get().originalOrder;
        const currentTracks = get().tracks;
        const currentPlayingTrackId = currentTracks[get().currentIndex]?.id;

        let newTracks: Track[];
        let newCurrentIndex = 0;

        if (currentIsShuffled) {
          // If unshuffling, restore original order
          newTracks = [...currentOriginalOrder];
        } else {
          // If shuffling, shuffle the original order
          newTracks = [...currentOriginalOrder].sort(() => Math.random() - 0.5);
        }

        // Find the index of the currently playing track in the new list
        const playingIndex = newTracks.findIndex(
          (track) => track.id === currentPlayingTrackId
        );
        if (playingIndex !== -1) {
          newCurrentIndex = playingIndex;
        } else if (newTracks.length > 0) {
          // Fallback if the playing track is somehow not found (e.g., after clearing)
          newCurrentIndex = 0;
        }

        set({
          isShuffled: !currentIsShuffled,
          tracks: newTracks,
          currentIndex: newCurrentIndex,
        });
      },
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (val) => set({ isPlaying: val }),
      toggleVideo: () => {
        // Only allow showing video if playing, but always allow hiding
        if (!get().showVideo && !get().isPlaying) {
            return; // Don't show video if paused
        }
        set((state) => ({ showVideo: !state.showVideo }));
      },
      toggleBacklight: () => set((state) => ({ backlightOn: !state.backlightOn })),
      setTheme: (theme) => set({ theme }),
      toggleLcdFilter: () => set((state) => ({ lcdFilterOn: !state.lcdFilterOn })),
      addTrack: (track) =>
        set((state) => {
          const newTracks = [...state.tracks, track];
          const newOriginalOrder = state.isShuffled
            ? [...state.originalOrder, track] // Add to original order even if shuffled
            : newTracks; // If not shuffled, new tracks are the new original order
          return {
            tracks: newTracks,
            originalOrder: newOriginalOrder,
            currentIndex: newTracks.length - 1, // Play the new track
            isPlaying: true, // Start playing automatically
          };
        }),
      clearLibrary: () =>
        set({
          tracks: [],
          originalOrder: [],
          currentIndex: 0,
          isPlaying: false,
        }),
      resetLibrary: () =>
        set({
          tracks: DEFAULT_TRACKS,
          originalOrder: DEFAULT_TRACKS,
          currentIndex: 0,
          isPlaying: false,
          isShuffled: false, // Also reset shuffle state
        }),
      nextTrack: () => {
        set((state) => {
          if (state.tracks.length === 0) return {};
          let nextIndex = state.currentIndex + 1;
          if (nextIndex >= state.tracks.length) {
            if (state.loopAll) {
              nextIndex = 0;
            } else {
              return { isPlaying: false }; // Stop playing if not looping and at the end
            }
          }
          return { currentIndex: nextIndex, isPlaying: true };
        });
      },
      previousTrack: () => {
        set((state) => {
          if (state.tracks.length === 0) return {};
          let prevIndex = state.currentIndex - 1;
          if (prevIndex < 0) {
            if (state.loopAll) {
              prevIndex = state.tracks.length - 1;
            } else {
              prevIndex = 0; // Go to first track but don't loop from start
            }
          }
          return { currentIndex: prevIndex, isPlaying: true };
        });
      },
    }),
    {
      name: "ryos:ipod", // Unique name for localStorage persistence
      // Persist only specific parts of the state
      partialize: (state) => ({
        tracks: state.tracks,
        originalOrder: state.originalOrder,
        currentIndex: state.currentIndex,
        loopAll: state.loopAll,
        loopCurrent: state.loopCurrent,
        isShuffled: state.isShuffled,
        theme: state.theme,
        lcdFilterOn: state.lcdFilterOn,
        // We might not want to persist isPlaying, showVideo, backlightOn
      }),
      // Handle migration from old storage if needed (optional)
      // version: 1, // example versioning
      // migrate: (persistedState, version) => { ... }
    }
  )
); 