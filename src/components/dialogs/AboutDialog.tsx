import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: {
    name: string;
    version: string;
    creator: {
      name: string;
      url: string;
    };
    github: string;
    icon: string;
  };
}

export function AboutDialog({
  isOpen,
  onOpenChange,
  metadata,
}: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-system7-window-bg border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] max-w-[280px]">
        <DialogHeader>About</DialogHeader>
        <div className="space-y-2 text-center p-4 pb-8">
          <div>
            <img
              src={metadata.icon}
              alt="App Icon"
              className="w-12 h-12 mx-auto [image-rendering:pixelated]"
            />
          </div>
          <div className="space-y-0 font-geneva-12 text-[10px]">
            <div className="text-2xl font-medium font-apple-garamond">
              {metadata.name}
            </div>
            <p className="text-gray-500">Version {metadata.version}</p>
            <p>
              Made by{" "}
              <a
                href={metadata.creator.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {metadata.creator.name}
              </a>
            </p>
            <p>
              <a
                href={metadata.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Open in GitHub
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
