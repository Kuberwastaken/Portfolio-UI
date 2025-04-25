import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Soundboard } from "@/types/types";
import { cn } from "@/lib/utils";

interface BoardListProps {
  boards: Soundboard[];
  activeBoardId: string;
  onBoardSelect: (id: string) => void;
  onNewBoard: () => void;
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  audioDevices: MediaDeviceInfo[];
  micPermissionGranted: boolean;
}

export function BoardList({
  boards,
  activeBoardId,
  onBoardSelect,
  onNewBoard,
  selectedDeviceId,
  onDeviceSelect,
  audioDevices,
  micPermissionGranted,
}: BoardListProps) {
  return (
    <div className="w-full bg-neutral-100 border-b flex flex-col max-h-44 overflow-hidden md:w-56 md:border-r md:border-b-0 md:max-h-full font-geneva-12 text-[12px]">
      <div className="py-3 px-3 flex flex-col flex-1 overflow-hidden">
        <div className="flex justify-between items-center md:mb-2">
          <h2 className="text-[14px] pl-1 mb-1">Soundboards</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewBoard}
            className="flex items-center text-xs hover:bg-black/5 w-[24px] h-[24px]"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {boards.map((board) => (
            <div
              key={board.id}
              className={cn(
                "px-2 py-1 cursor-pointer",
                board.id === activeBoardId
                  ? "bg-black text-white"
                  : "hover:bg-black/5"
              )}
              onClick={() => onBoardSelect(board.id)}
            >
              {board.name}
            </div>
          ))}
        </div>

        {micPermissionGranted && (
          <div className="mt-auto pt-2 border-t border-gray-300 px-2 pb-2">
            <Select value={selectedDeviceId} onValueChange={onDeviceSelect}>
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId} className="text-xs">
                    {device.label ||
                      `Microphone ${device.deviceId.slice(0, 4)}...`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
