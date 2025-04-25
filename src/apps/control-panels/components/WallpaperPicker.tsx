import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWallpaper } from "@/hooks/useWallpaper";
import { useSound, Sounds } from "@/hooks/useSound";
import {
  DisplayMode,
  loadDisplayMode,
  applyDisplayMode,
} from "@/utils/displayMode";
import { Plus } from "lucide-react";

// Remove unused constants
interface WallpaperItemProps {
  path: string;
  isSelected: boolean;
  onClick: () => void;
  isTile?: boolean;
  isVideo?: boolean;
  previewUrl?: string; // For IndexedDB references
}

function WallpaperItem({
  path,
  isSelected,
  onClick,
  isTile = false,
  isVideo = false,
  previewUrl,
}: WallpaperItemProps) {
  const { play: playClick } = useSound(Sounds.BUTTON_CLICK, 0.3);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(isVideo);
  const displayUrl = previewUrl || path;

  const handleClick = () => {
    playClick();
    onClick();
  };

  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isSelected) {
        videoRef.current
          .play()
          .catch((err) => console.error("Error playing video:", err));
      } else {
        videoRef.current.pause();
      }

      // Check if video is already cached/loaded
      if (videoRef.current.readyState >= 3) {
        // HAVE_FUTURE_DATA or better
        setIsLoading(false);
      }
    }
  }, [isSelected, isVideo, displayUrl]);

  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  if (isVideo) {
    return (
      <div
        className={`w-full aspect-video border-2 cursor-pointer hover:opacity-90 ${
          isSelected ? "ring-2 ring-black border-white" : "border-transparent"
        } relative overflow-hidden`}
        onClick={handleClick}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-700/30">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"
              style={{
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s infinite ease-in-out",
              }}
            />
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={displayUrl}
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoaded}
          onCanPlayThrough={handleCanPlayThrough}
          style={{
            objectPosition: "center center",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full ${
        isTile ? "aspect-square" : "aspect-video"
      } border-2 cursor-pointer hover:opacity-90 ${
        isSelected ? "ring-2 ring-black border-white" : "border-transparent"
      }`}
      style={{
        backgroundImage: `url(${displayUrl})`,
        backgroundSize: isTile ? "64px 64px" : "cover",
        backgroundPosition: isTile ? undefined : "center",
        backgroundRepeat: isTile ? "repeat" : undefined,
      }}
      onClick={handleClick}
    />
  );
}

type PhotoCategory =
  | "3d_graphics"
  | "convergency"
  | "foliage"
  | "landscapes"
  | "nostalgia"
  | "objects"
  | "structures"
  | "videos"
  | "custom";

const TILE_WALLPAPERS = [
  "default",
  "macos",
  "bondi",
  "bondi_dark",
  "bondi_light",
  "bondi_medium",
  "bondi_extra_dark",
  "french_blue_dark",
  "french_blue_light",
  "sunny",
  "sunny_dark",
  "sunny_light",
  "poppy",
  "poppy_dark",
  "poppy_light",
  "poppy_medium",
  "azul_dark",
  "azul_light",
  "azul_extra_light",
  "pistachio_dark",
  "pistachio_light",
  "pistachio_medium",
  "candy_bar",
  "candy_bar_sunny",
  "candy_bar_pistachio",
  "candy_bar_azul",
  "waves_sunny",
  "waves_bondi",
  "waves_azul",
  "ripple_poppy",
  "ripple_bondi",
  "ripple_azul",
  "rio_pistachio",
  "rio_azul",
  "bubbles_poppy",
  "bubbles_bondi",
  "bossanova_poppy",
  "bossanova_poppy_2",
  "bossanova_bondi",
  "diagonals_poppy",
  "diagonals_bondi",
  "diagonals_bondi_dark",
  "flat_peanuts",
  "flat_peanuts_poppy",
  "peanuts_pistachio",
  "peanuts_azul",
].map((name) => `/wallpapers/tiles/${name}.png`);

// Add video wallpapers
const VIDEO_WALLPAPERS = [
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/cancun_sunset_loop-9ANCNr8P6N24yiSjr39WOjKadDT3X3.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/clouds-JvRX6JrjKjXk0nxPljwO8okrEVhRH5.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/red_clouds_loop-g6I8T9DlXNkPxUfgrJtCkrQh5slAKp.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/galway_bay-aDogTnnmx92MpkpuOwX8QjS9GjGqXG.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/glacier_national_park-zU5Sre6MixUSMcMw1mOjCJZDexLFqe.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/lily_pad-ewDMSKULDgURywNkocVRnuRJHkAjvh.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/golden_poppy_loop-3L7WvZYDFI4NBcMZOPqGctYptFZZ0u.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/red_tulips-2xvdKI4P13vFVRs35XRDScruE3RUiT.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/blue_flowers_loop-p42FtjYrf2DMZ8ZlgNR2tWZrCfDuSL.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/golden_gate_dusk-vwlMXQIHDKMOPQnqPlTPB5fGTZAtTK.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/fish_eagle-nnO0aaeeLdliCSHg3jsHiJHf7r6kdd.mp4",
  "https://j7dwymn73wqwkbwj.public.blob.vercel-storage.com/videos/bliss_og-FRrs4u8TrHCBTgwfk9GzInMKaQBIGh.mp4",
];

const PHOTO_WALLPAPERS: Record<PhotoCategory, string[]> = {
  "3d_graphics": [
    "capsule",
    "capsule_azul",
    "capsule_pistachio",
    "tub",
    "tub_azul",
    "tub_bondi",
    "ufo_1",
    "ufo_2",
    "ufo_3",
  ],
  convergency: Array.from({ length: 15 }, (_, i) => `convergence_${i + 1}`),
  foliage: [
    "blue_flowers",
    "cactus",
    "golden_poppy",
    "red_cyclamens",
    "red_tulips",
    "rose",
    "spider_lily",
    "waterdrops_on_leaf",
    "yellow_tulips",
  ],
  landscapes: [
    "beach",
    "clouds",
    "french_alps",
    "ganges_river",
    "golden_gate_at_dusk",
    "mono_lake",
    "palace_on_lake_in_jaipur",
    "rain_god_mesa",
    "refuge-col_de_la_grasse-alps",
    "zabriskie_point",
  ],
  nostalgia: [
    "acropolis",
    "beach_on_ko_samui",
    "birds_in_flight",
    "cancun_sunset",
    "cliffs_of_moher",
    "fish_eagle",
    "galway_bay",
    "glacier_national_park",
    "highway_395",
    "hong_kong_at_night",
    "islamorada_sunrise",
    "lily_pad",
    "long_island_sound",
    "mac_os_background",
    "midsummer_night",
    "moraine_lake",
    "oasis_in_baja",
    "red_clouds",
    "toronto_skyline",
    "tuolumne_meadows",
    "yosemite_valley",
    "yucatan",
  ],
  objects: [
    "alpine_granite",
    "bicycles",
    "bottles",
    "burmese_claypots",
    "burning_candle",
    "chairs",
    "faucet_handle",
    "neon",
    "salt_shaker_top",
    "shamus",
  ],
  structures: [
    "gate",
    "gate_lock",
    "glass_door_knob",
    "padlock",
    "rusty_lock",
    "shutters",
    "stone_wall",
    "wall_of_stones",
  ],
  videos: VIDEO_WALLPAPERS,
  custom: [], // This will be populated dynamically
};

// Transform photo paths
Object.entries(PHOTO_WALLPAPERS).forEach(([category, photos]) => {
  if (category !== "videos" && category !== "custom") {
    PHOTO_WALLPAPERS[category as PhotoCategory] = photos.map(
      (name) => `/wallpapers/photos/${category}/${name}.jpg`
    );
  }
});

const PHOTO_CATEGORIES = Object.keys(PHOTO_WALLPAPERS) as PhotoCategory[];

interface WallpaperPickerProps {
  onSelect?: (path: string) => void;
}

export function WallpaperPicker({ onSelect }: WallpaperPickerProps) {
  const {
    currentWallpaper,
    setWallpaper,
    INDEXEDDB_PREFIX,
    loadCustomWallpapers,
    getWallpaperData,
  } = useWallpaper();

  const { play: playClick } = useSound(Sounds.BUTTON_CLICK, 0.3);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() =>
    loadDisplayMode()
  );
  const [customWallpaperRefs, setCustomWallpaperRefs] = useState<string[]>([]);
  const [customWallpaperPreviews, setCustomWallpaperPreviews] = useState<
    Record<string, string>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<
    "tiles" | PhotoCategory
  >(() => {
    // Set initial category based on current wallpaper
    if (currentWallpaper.includes("/wallpapers/tiles/")) {
      return "tiles";
    }
    if (currentWallpaper.startsWith(INDEXEDDB_PREFIX)) {
      return "custom";
    }
    if (VIDEO_WALLPAPERS.includes(currentWallpaper)) {
      return "videos";
    }
    for (const category of PHOTO_CATEGORIES) {
      if (currentWallpaper.includes(`/wallpapers/photos/${category}/`)) {
        return category;
      }
    }
    return "tiles";
  });

  // Load custom wallpapers from IndexedDB (just the references)
  useEffect(() => {
    const fetchCustomWallpapers = async () => {
      try {
        const refs = await loadCustomWallpapers();
        setCustomWallpaperRefs(refs);

        // Load preview data for each reference
        const previews: Record<string, string> = {};
        for (const ref of refs) {
          const data = await getWallpaperData(ref);
          if (data) {
            previews[ref] = data;
          }
        }
        setCustomWallpaperPreviews(previews);
      } catch (error) {
        console.error("Error fetching custom wallpapers:", error);
      }
    };

    fetchCustomWallpapers();
  }, [loadCustomWallpapers, getWallpaperData, INDEXEDDB_PREFIX]);

  const handleWallpaperSelect = (path: string) => {
    setWallpaper(path);
    playClick();
    if (onSelect) {
      onSelect(path);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const isImage = file.type.startsWith("image/");

    if (!isImage) {
      alert("Please select an image file. Videos are not supported.");
      return;
    }

    try {
      // Upload directly using the setWallpaper method which now accepts File objects
      await setWallpaper(file);

      // Refresh the custom wallpapers list
      const refs = await loadCustomWallpapers();
      setCustomWallpaperRefs(refs);

      // Load preview for the new wallpaper
      for (const ref of refs) {
        if (!customWallpaperPreviews[ref]) {
          const data = await getWallpaperData(ref);
          if (data) {
            setCustomWallpaperPreviews((prev) => ({
              ...prev,
              [ref]: data,
            }));
          }
        }
      }

      // Switch to custom category
      setSelectedCategory("custom");
    } catch (error) {
      console.error("Error uploading wallpaper:", error);
      alert("Error uploading wallpaper. Please try again with a smaller file.");
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Force rerender when wallpaper changes
  useEffect(() => {
    if (currentWallpaper.includes("/wallpapers/tiles/")) {
      setSelectedCategory("tiles");
    } else if (currentWallpaper.startsWith(INDEXEDDB_PREFIX)) {
      setSelectedCategory("custom");
    } else if (VIDEO_WALLPAPERS.includes(currentWallpaper)) {
      setSelectedCategory("videos");
    } else {
      for (const category of PHOTO_CATEGORIES) {
        if (currentWallpaper.includes(`/wallpapers/photos/${category}/`)) {
          setSelectedCategory(category);
          break;
        }
      }
    }
  }, [currentWallpaper, INDEXEDDB_PREFIX]);

  const formatCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    applyDisplayMode(mode);
  };

  // Determine if a wallpaper is a video
  const isVideoWallpaper = (path: string, previewUrl?: string) => {
    const url = previewUrl || path;
    return (
      url.endsWith(".mp4") ||
      url.includes("video/") ||
      (url.startsWith("https://") && /\.(mp4|webm|ogg)($|\?)/.test(url))
    );
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-2">
        <div className="flex-[3]">
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              setSelectedCategory(value as typeof selectedCategory)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="videos">
                Videos
                <span className="ml-1.5 px-0.5 text-[9px] font-geneva-12 bg-neutral-500 text-white rounded-md">
                  NEW
                </span>
              </SelectItem>
              <SelectItem value="custom">
                Custom
                <span className="ml-1.5 px-0.5 text-[9px] font-geneva-12 bg-neutral-500 text-white rounded-md">
                  NEW
                </span>
              </SelectItem>
              <SelectItem value="tiles">Tiled Patterns</SelectItem>
              {PHOTO_CATEGORIES.filter(
                (cat) => cat !== "custom" && cat !== "videos"
              ).map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={displayMode} onValueChange={handleDisplayModeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Color</SelectItem>
            <SelectItem value="monotone">Mono</SelectItem>
            <SelectItem value="crt">CRT</SelectItem>
            <SelectItem value="sepia">Sepia</SelectItem>
            <SelectItem value="high-contrast">High Contrast</SelectItem>
            <SelectItem value="dream">Dream</SelectItem>
            <SelectItem value="invert">Invert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedCategory === "custom" && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      )}

      <ScrollArea className="flex-1 h-[200px]">
        <div
          className={`grid gap-2 p-1 ${
            selectedCategory === "tiles" ? "grid-cols-8" : "grid-cols-3"
          }`}
        >
          {selectedCategory === "tiles" ? (
            TILE_WALLPAPERS.map((path) => (
              <WallpaperItem
                key={path}
                path={path}
                isSelected={currentWallpaper === path}
                onClick={() => handleWallpaperSelect(path)}
                isTile
              />
            ))
          ) : selectedCategory === "videos" ? (
            VIDEO_WALLPAPERS.map((path) => (
              <WallpaperItem
                key={path}
                path={path}
                isSelected={currentWallpaper === path}
                onClick={() => handleWallpaperSelect(path)}
                isVideo
              />
            ))
          ) : selectedCategory === "custom" ? (
            <>
              <div
                className="w-full aspect-video border-[2px] border-dotted border-gray-400 cursor-pointer hover:opacity-90 flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-5 w-5 text-gray-500" />
              </div>
              {customWallpaperRefs.length > 0 ? (
                customWallpaperRefs.map((path) => (
                  <WallpaperItem
                    key={path}
                    path={path}
                    previewUrl={customWallpaperPreviews[path]}
                    isSelected={currentWallpaper === path}
                    onClick={() => handleWallpaperSelect(path)}
                    isVideo={isVideoWallpaper(
                      path,
                      customWallpaperPreviews[path]
                    )}
                  />
                ))
              ) : (
                <></>
              )}
            </>
          ) : PHOTO_WALLPAPERS[selectedCategory] ? (
            PHOTO_WALLPAPERS[selectedCategory].map((path) => (
              <WallpaperItem
                key={path}
                path={path}
                isSelected={currentWallpaper === path}
                onClick={() => handleWallpaperSelect(path)}
              />
            ))
          ) : (
            <div className="col-span-4 text-center py-8 text-gray-500">
              Photos coming soon for this category...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
