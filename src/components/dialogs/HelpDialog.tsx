import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

interface HelpCardProps {
  icon: string;
  title: string;
  description: string;
}

function HelpCard({ icon, title, description }: HelpCardProps) {
  return (
    <div className="p-4 bg-black/5 rounded-lg transition-colors">
      <div className="text-xl">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-gray-700  font-geneva-12 text-[10px]">{description}</p>
    </div>
  );
}

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  helpItems: HelpCardProps[];
  appName: string;
}

export function HelpDialog({
  isOpen,
  onOpenChange,
  helpItems = [],
  appName,
}: HelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-system7-window-bg border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] max-w-[600px]">
        <DialogHeader>Help</DialogHeader>
        <div className="p-6 pt-2">
          <p className="text-2xl mb-4 font-apple-garamond">
            Welcome to {appName}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {helpItems.map((item) => (
              <HelpCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
