import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppProps } from "../../base/types";
import { MenuBar } from "@/components/layout/MenuBar";
import { Favorite, HistoryEntry } from "@/stores/useInternetExplorerStore";

interface InternetExplorerMenuBarProps extends Omit<AppProps, "onClose"> {
  onRefresh?: () => void;
  onStop?: () => void;
  onGoToUrl?: () => void;
  onHome?: () => void;
  onShowHelp?: () => void;
  onShowAbout?: () => void;
  isLoading?: boolean;
  favorites?: Favorite[];
  history?: HistoryEntry[];
  onAddFavorite?: () => void;
  onClearFavorites?: () => void;
  onResetFavorites?: () => void;
  onNavigateToFavorite?: (url: string, year?: string) => void;
  onNavigateToHistory?: (url: string, year?: string) => void;
  onFocusUrlInput?: () => void;
  onClose?: () => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onClearHistory?: () => void;
  onEditFuture?: () => void;
}

export function InternetExplorerMenuBar({
  onRefresh,
  onStop,
  onHome,
  onShowHelp,
  onShowAbout,
  isLoading,
  favorites = [],
  history = [],
  onAddFavorite,
  onClearFavorites,
  onResetFavorites,
  onNavigateToFavorite,
  onNavigateToHistory,
  onFocusUrlInput,
  onClose,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  onClearHistory,
  onEditFuture,
}: InternetExplorerMenuBarProps) {
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
            onClick={onFocusUrlInput}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Go to URL
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

      {/* Edit Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Edit
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={onRefresh}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onStop}
            disabled={!isLoading}
            className={
              !isLoading
                ? "text-gray-400 text-md h-6 px-3"
                : "text-md h-6 px-3 active:bg-gray-900 active:text-white"
            }
          >
            Stop
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onEditFuture}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Edit Future...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Favorites Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Favorites
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0 max-w-xs">
          <DropdownMenuItem
            onClick={onHome}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Go Home
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onAddFavorite}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Add to Favorites...
          </DropdownMenuItem>
          {favorites.length > 0 && (
            <>
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              {favorites.map((favorite) => (
                <DropdownMenuItem
                  key={favorite.url}
                  onClick={() =>
                    onNavigateToFavorite?.(favorite.url, favorite.year)
                  }
                  className="text-md h-6 px-3 active:bg-gray-900 active:text-white flex items-center gap-2"
                >
                  <img
                    src={favorite.favicon || "/icons/ie-site.png"}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      e.currentTarget.src = "/icons/ie-site.png";
                    }}
                  />
                  {favorite.title}
                  {favorite.year && favorite.year !== "current" && (
                    <span className="text-xs text-gray-500">
                      ({favorite.year})
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              <DropdownMenuItem
                onClick={onClearFavorites}
                className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
              >
                Clear Favorites...
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            onClick={onResetFavorites}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Reset Favorites...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* History Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            History
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={1}
          className="px-0 max-h-[400px] overflow-y-auto max-w-xs"
        >
          <DropdownMenuItem
            onClick={onGoBack}
            disabled={!canGoBack}
            className={
              !canGoBack
                ? "text-gray-400 text-md h-6 px-3"
                : "text-md h-6 px-3 active:bg-gray-900 active:text-white"
            }
          >
            Back
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onGoForward}
            disabled={!canGoForward}
            className={
              !canGoForward
                ? "text-gray-400 text-md h-6 px-3"
                : "text-md h-6 px-3 active:bg-gray-900 active:text-white"
            }
          >
            Forward
          </DropdownMenuItem>

          {history.length > 0 && (
            <>
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              {history.slice(0, 10).map((entry) => (
                <DropdownMenuItem
                  key={entry.url + entry.timestamp}
                  onClick={() => onNavigateToHistory?.(entry.url, entry.year || "current")}
                  className="text-md h-6 px-3 active:bg-gray-900 active:text-white flex items-center gap-2"
                >
                  <img
                    src={entry.favicon || "/icons/ie-site.png"}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      e.currentTarget.src = "/icons/ie-site.png";
                    }}
                  />
                  <span className="truncate">
                    {entry.title}
                    {entry.year && entry.year !== "current" && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({entry.year})
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
              <DropdownMenuItem
                onClick={onClearHistory}
                className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
              >
                Clear History...
              </DropdownMenuItem>
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
            Internet Explorer Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShowAbout}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About Internet Explorer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuBar>
  );
}
