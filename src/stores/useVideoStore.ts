import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface VideoStoreState {
  videos: Video[];
  currentIndex: number;
  loopAll: boolean;
  loopCurrent: boolean;
  isShuffled: boolean;
  isPlaying: boolean;
  // actions
  setVideos: (videos: Video[] | ((prev: Video[]) => Video[])) => void;
  setCurrentIndex: (index: number) => void;
  setLoopAll: (val: boolean) => void;
  setLoopCurrent: (val: boolean) => void;
  setIsShuffled: (val: boolean) => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
}

const getInitialState = () => ({
  videos: DEFAULT_VIDEOS,
  currentIndex: 0,
  loopAll: true,
  loopCurrent: false,
  isShuffled: false,
  isPlaying: false,
});

export const useVideoStore = create<VideoStoreState>()(
  persist(
    (set) => ({
      ...getInitialState(),

      setVideos: (videosOrUpdater) => {
        set((state) => {
          const newVideos =
            typeof videosOrUpdater === "function"
              ? (videosOrUpdater as (prev: Video[]) => Video[])(state.videos)
              : videosOrUpdater;
          return { videos: newVideos } as Partial<VideoStoreState>;
        });
      },
      setCurrentIndex: (index) => set({ currentIndex: index }),
      setLoopAll: (val) => set({ loopAll: val }),
      setLoopCurrent: (val) => set({ loopCurrent: val }),
      setIsShuffled: (val) => set({ isShuffled: val }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (val) => set({ isPlaying: val }),
    }),
    {
      name: "ryos:videos",
      partialize: (state) => ({
        videos: state.videos,
        currentIndex: state.currentIndex,
        loopAll: state.loopAll,
        loopCurrent: state.loopCurrent,
        isShuffled: state.isShuffled,
      }),
    }
  )
); 