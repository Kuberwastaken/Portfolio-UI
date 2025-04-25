import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { getNonFinderApps } from "@/config/appRegistry";
import { useAppContext } from "@/contexts/AppContext";
import { useMemo } from "react";

interface AboutFinderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AppMemoryUsage {
  name: string;
  memoryMB: number;
  percentage: number;
}

export function AboutFinderDialog({
  isOpen,
  onOpenChange,
}: AboutFinderDialogProps) {
  const { appStates } = useAppContext();

  const memoryUsage = useMemo(() => {
    const totalMemory = 32; // 32MB total memory
    const systemUsage = 8.5; // System takes about 8.5MB
    const apps = getNonFinderApps();

    // Get only open apps
    const openApps = apps.filter((app) => appStates[app.id]?.isOpen);

    // Calculate memory usage for system and open apps (limited to 4)
    const appUsages: AppMemoryUsage[] = [
      {
        name: "System",
        memoryMB: systemUsage,
        percentage: (systemUsage / totalMemory) * 100,
      },
      ...openApps.map((app, index) => {
        const memory = 1.5 + index * 0.5; // Simulate different memory usage per app
        return {
          name: app.name,
          memoryMB: memory,
          percentage: (memory / totalMemory) * 100,
        };
      }),
    ];

    return appUsages;
  }, [appStates]);

  const totalUsedMemory = useMemo(() => {
    return memoryUsage.reduce((acc, app) => acc + app.memoryMB, 0);
  }, [memoryUsage]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-system7-window-bg border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] max-w-[400px] focus:outline-none">
        <DialogHeader>About This Computer</DialogHeader>

        <div className="flex">
          {/* Right side with system info */}
          <div className="space-y-3 flex-1 ">
            <div className="flex flex-row items-center space-x-2 p-2 px-4">
              <div className="flex flex-col w-1/3 items-center space-x-2">
                <img
                  src="/icons/mac-classic.png"
                  alt="Happy Mac"
                  className="w-10 h-10 mb-0 [image-rendering:pixelated]"
                />
                <div className="font-apple-garamond text-xl">ryOS 8.2</div>
              </div>

              <div className="space-y-4 font-geneva-12 text-[10px]">
                <div>
                  <div>Built-in Memory: 32MB</div>
                  <div>Virtual Memory: Off</div>
                  <div>
                    Largest Unused Block: {(32 - totalUsedMemory).toFixed(1)}MB
                  </div>
                  <div className="text-[10px] text-gray-500  mt-2  font-geneva-12 text-[10px]">
                    © Ryo Lu. 1992-{new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
            <hr className="border-gray-300" />

            {/* Memory usage bars */}
            <div className="space-y-2 font-geneva-12 text-[10px] p-2 px-4 pb-4">
              {memoryUsage.map((app, index) => (
                <div className="flex flex-row gap-1" key={index}>
                  <div className="flex justify-between w-full">
                    <div className="w-1/2 truncate">{app.name}</div>
                    <div className="w-1/3">{app.memoryMB.toFixed(1)} MB</div>
                  </div>
                  <div className="h-2 bg-gray-200 w-full ">
                    <div
                      className="h-full bg-gray-900 "
                      style={{ width: `${app.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
