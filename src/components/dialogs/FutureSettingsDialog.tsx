import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { useInternetExplorerStore, DEFAULT_TIMELINE } from "@/stores/useInternetExplorerStore";

interface FutureSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FutureSettingsDialog = ({
  isOpen,
  onOpenChange,
}: FutureSettingsDialogProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("2030");
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use the store directly
  const { timelineSettings, setTimelineSettings, year: currentYear } = useInternetExplorerStore();

  // Update selectedYear when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (currentYear === "current" || parseInt(currentYear) <= new Date().getFullYear()) {
        setSelectedYear("2030");
      } else {
        setSelectedYear(currentYear);
      }
    }
  }, [isOpen, currentYear]);

  // Create a richer set of future years – covering near, mid, and far future
  const futureYears = [
    // Near‑future (every decade up to 2100)
    ...Array.from({ length: 8 }, (_, i) => (2030 + i * 10).toString()), // 2030 → 2100
    // Mid & far‑future milestones
    "2150", "2200", "2250", "2300", "2400", "2500", "2750", "3000"
  ].sort((a, b) => parseInt(b) - parseInt(a)); // Newest (largest) first

  // Get default timeline text for a year
  const getDefaultTimelineText = (year: string): string => {
    return DEFAULT_TIMELINE[year] || "2020s: Current era. AI assistants. Smart devices. Electric vehicles. Renewable energy. Space tourism. Digital transformation. Remote work. Virtual reality. Genetic medicine.";
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleReset = () => {
    const newSettings = { ...timelineSettings };
    delete newSettings[selectedYear]; // Remove custom text for this year
    setTimelineSettings(newSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-system7-window-bg border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          saveButtonRef.current?.focus();
        }}
      >
        <DialogHeader>Edit Future Timeline</DialogHeader>
        <div className="p-4 px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-geneva-12 text-[12px]">Year:</span>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {futureYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={timelineSettings[selectedYear] || getDefaultTimelineText(selectedYear)}
              onChange={(e) => {
                const newSettings = { ...timelineSettings, [selectedYear]: e.target.value };
                setTimelineSettings(newSettings);
              }}
              placeholder={getDefaultTimelineText(selectedYear)}
              className="min-h-[200px] font-geneva-12 text-[12px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="retro" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="retro" onClick={() => onOpenChange(false)} ref={saveButtonRef}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FutureSettingsDialog; 