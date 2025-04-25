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

interface Video {
  id: string;
  url: string;
  title: string;
}

interface VideosMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  videos: Video[];
  currentIndex: number;
  onPlayVideo: (index: number) => void;
  onClearPlaylist: () => void;
  onShufflePlaylist: () => void;
  onToggleLoopAll: () => void;
  onToggleLoopCurrent: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddVideo: () => void;
  onOpenVideo: () => void;
  onResetPlaylist: () => void;
  isLoopAll: boolean;
  isLoopCurrent: boolean;
  isPlaying: boolean;
  isShuffled: boolean;
  onFullScreen: () => void;
}

export function VideosMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  videos,
  currentIndex,
  onPlayVideo,
  onClearPlaylist,
  onShufflePlaylist,
  onToggleLoopAll,
  onToggleLoopCurrent,
  onTogglePlay,
  onNext,
  onPrevious,
  onAddVideo,
  onOpenVideo,
  onResetPlaylist,
  isLoopAll,
  isLoopCurrent,
  isPlaying,
  isShuffled,
  onFullScreen,
}: VideosMenuBarProps) {
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
            onClick={onOpenVideo}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Open Video...
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
            onClick={onTogglePlay}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={videos.length === 0}
          >
            {isPlaying ? "Pause" : "Play"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onPrevious}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={videos.length === 0}
          >
            Previous
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onNext}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={videos.length === 0}
          >
            Next
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onFullScreen}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Full Screen
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShufflePlaylist}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isShuffled && "pl-4")}>
              {isShuffled ? "✓ Shuffle" : "Shuffle"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleLoopAll}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isLoopAll && "pl-4")}>
              {isLoopAll ? "✓ Repeat All" : "Repeat All"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleLoopCurrent}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isLoopCurrent && "pl-4")}>
              {isLoopCurrent ? "✓ Repeat One" : "Repeat One"}
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
            onClick={onAddVideo}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Add to Library...
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onClearPlaylist}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Clear Library
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onResetPlaylist}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Reset Library
          </DropdownMenuItem>
          {videos.length > 0 && (
            <>
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              {videos.map((video, index) => (
                <DropdownMenuItem
                  key={video.id}
                  onClick={() => onPlayVideo(index)}
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
                    <span className="truncate">{video.title}</span>
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
            Videos Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShowAbout}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About Videos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuBar>
  );
}
