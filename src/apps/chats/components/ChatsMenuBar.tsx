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
import { type ChatRoom } from "../../../../src/types/chat";

interface ChatsMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onClearChats: () => void;
  onSaveTranscript: () => void;
  onSetUsername: () => void;
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  onAddRoom: () => void;
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom | null) => void;
  isAdmin: boolean;
}

export function ChatsMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  onClearChats,
  onSaveTranscript,
  onSetUsername,
  onToggleSidebar,
  isSidebarVisible,
  onAddRoom,
  rooms,
  currentRoom,
  onRoomSelect,
  isAdmin,
}: ChatsMenuBarProps) {
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
            onClick={onSaveTranscript}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Save Transcript...
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onClearChats}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Clear Chat
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

      {/* Rooms Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 text-md px-2 py-1 border-none hover:bg-gray-200 active:bg-gray-900 active:text-white focus-visible:ring-0"
          >
            Rooms
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0 max-h-[300px] overflow-y-auto">
          {isAdmin && (
            <DropdownMenuItem
              onClick={onAddRoom}
              className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            >
              New Room...
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onSetUsername}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Set Username...
          </DropdownMenuItem>
          
          {rooms.length > 0 && (
            <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          )}
          
          {/* Ryo Chat Option */}
          <DropdownMenuItem
            onClick={() => onRoomSelect(null)}
            className={cn(
              "text-md h-6 px-3 active:bg-gray-900 active:text-white",
              currentRoom === null && "bg-gray-200"
            )}
          >
            <span className={cn(currentRoom !== null && "pl-4")}>
              {currentRoom === null ? "✓ @ryo" : "@ryo"}
            </span>
          </DropdownMenuItem>
          
          {/* Room List */}
          {rooms.map(room => (
            <DropdownMenuItem
              key={room.id}
              onClick={() => onRoomSelect(room)}
              className={cn(
                "text-md h-6 px-3 active:bg-gray-900 active:text-white",
                currentRoom?.id === room.id && "bg-gray-200"
              )}
            >
              <span className={cn(!(currentRoom?.id === room.id) && "pl-4")}>
                {currentRoom?.id === room.id ? `✓ #${room.name}` : `#${room.name}`}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 text-md px-2 py-1 border-none hover:bg-gray-200 active:bg-gray-900 active:text-white focus-visible:ring-0"
          >
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={() => {
              console.log("[MenuBar] Toggle Sidebar menu item clicked");
              onToggleSidebar();
            }}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            <span className={cn(!isSidebarVisible && "pl-4")}>
              {isSidebarVisible ? "✓ Show Rooms" : "Show Rooms"}
            </span>
          </DropdownMenuItem>
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
            Chats Help
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShowAbout}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About Chats
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuBar>
  );
}
