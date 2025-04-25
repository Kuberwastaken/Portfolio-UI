import { Button } from "@/components/ui/button";
import { MenuBar } from "@/components/layout/MenuBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIpodStore } from "@/stores/useIpodStore";

interface IpodMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onClearLibrary: () => void;
  onResetLibrary: () => void;
  onAddTrack: () => void;
}

export function IpodMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  onClearLibrary,
  onResetLibrary,
  onAddTrack,
}: IpodMenuBarProps) {
  const tracks = useIpodStore((s) => s.tracks);
  const currentIndex = useIpodStore((s) => s.currentIndex);
  const isLoopAll = useIpodStore((s) => s.loopAll);
  const isLoopCurrent = useIpodStore((s) => s.loopCurrent);
  const isPlaying = useIpodStore((s) => s.isPlaying);
  const isShuffled = useIpodStore((s) => s.isShuffled);
  const isBacklightOn = useIpodStore((s) => s.backlightOn);
  const isVideoOn = useIpodStore((s) => s.showVideo);
  const isLcdFilterOn = useIpodStore((s) => s.lcdFilterOn);
  const currentTheme = useIpodStore((s) => s.theme);

  const setCurrentIndex = useIpodStore((s) => s.setCurrentIndex);
  const setIsPlaying = useIpodStore((s) => s.setIsPlaying);
  const toggleLoopAll = useIpodStore((s) => s.toggleLoopAll);
  const toggleLoopCurrent = useIpodStore((s) => s.toggleLoopCurrent);
  const toggleShuffle = useIpodStore((s) => s.toggleShuffle);
  const togglePlay = useIpodStore((s) => s.togglePlay);
  const nextTrack = useIpodStore((s) => s.nextTrack);
  const previousTrack = useIpodStore((s) => s.previousTrack);
  const toggleBacklight = useIpodStore((s) => s.toggleBacklight);
  const toggleVideo = useIpodStore((s) => s.toggleVideo);
  const toggleLcdFilter = useIpodStore((s) => s.toggleLcdFilter);
  const setTheme = useIpodStore((s) => s.setTheme);

  const handlePlayTrack = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  return (
    <MenuBar>
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 text-md px-2 py-1 border-none hover:bg-gray-200 active:bg-gray-900 active:text-white focus-visible:ring-0"
          >
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={onAddTrack}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Add Music...
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onClose}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controls Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Controls
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={togglePlay}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={tracks.length === 0}
          >
            {isPlaying ? "Pause" : "Play"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={previousTrack}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={tracks.length === 0}
          >
            Previous
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={nextTrack}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={tracks.length === 0}
          >
            Next
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={toggleShuffle}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isShuffled && "pl-4")}>
              {isShuffled ? "✓ Shuffle" : "Shuffle"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleLoopAll}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isLoopAll && "pl-4")}>
              {isLoopAll ? "✓ Repeat All" : "Repeat All"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleLoopCurrent}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isLoopCurrent && "pl-4")}>
              {isLoopCurrent ? "✓ Repeat One" : "Repeat One"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={toggleBacklight}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isBacklightOn && "pl-4")}>
              {isBacklightOn ? "✓ Backlight" : "Backlight"}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={toggleLcdFilter}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isLcdFilterOn && "pl-4")}>
              {isLcdFilterOn ? "✓ LCD Filter" : "LCD Filter"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleVideo}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={!isPlaying}
          >
            <span className={cn(!isVideoOn && "pl-4")}>
              {isVideoOn ? "✓ Video" : "Video"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={() => setTheme("classic")}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(currentTheme !== "classic" && "pl-4")}>
              {currentTheme === "classic" ? "✓ Classic" : "Classic"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("black")}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(currentTheme !== "black" && "pl-4")}>
              {currentTheme === "black" ? "✓ Black" : "Black"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Library Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Library
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0 max-w-xs">
          <DropdownMenuItem
            onClick={onAddTrack}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Add to Library...
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onClearLibrary}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Clear Library
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onResetLibrary}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Reset Library
          </DropdownMenuItem>
          {tracks.length > 0 && (
            <>
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              {tracks.map((track, index) => (
                <DropdownMenuItem
                  key={track.id}
                  onClick={() => handlePlayTrack(index)}
                  className={cn(
                    "text-md h-6 px-3 active:bg-gray-900 active:text-white max-w-[220px] truncate",
                    index === currentIndex && "bg-gray-200"
                  )}
                >
                  <div className="flex items-center w-full truncate">
                    <span
                      className={cn(
                        "flex-none",
                        index === currentIndex ? "mr-1" : "pl-5"
                      )}
                    >
                      {index === currentIndex ? "♪ " : ""}
                    </span>
                    <span className="truncate">{track.title}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Help Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={onShowHelp}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            iPod Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShowAbout}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About iPod
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuBar>
  );
}
