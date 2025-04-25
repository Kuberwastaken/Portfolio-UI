import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface PaintToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

const tools = [
  // Selection tools
  { id: "select", icon: "/icons/macpaint/lasso.png", label: "Select" },
  {
    id: "rect-select",
    icon: "/icons/macpaint/select.png",
    label: "Rectangle Select",
  },

  // Text and eraser
  { id: "hand", icon: "/icons/macpaint/hand.png", label: "Hand" },

  { id: "text", icon: "/icons/macpaint/text.png", label: "Text" },

  // Fill and spray
  { id: "bucket", icon: "/icons/macpaint/bucket.png", label: "Fill Color" },
  { id: "spray", icon: "/icons/macpaint/spray.png", label: "Spray" },

  // Drawing tools
  { id: "brush", icon: "/icons/macpaint/brush.png", label: "Brush" },
  { id: "pencil", icon: "/icons/macpaint/pencil.png", label: "Pencil" },

  // Shapes
  { id: "line", icon: "/icons/macpaint/line.png", label: "Line" },
  { id: "eraser", icon: "/icons/macpaint/eraser.png", label: "Eraser" },

  {
    id: "rectangle",
    icon: "/icons/macpaint/rectangle.png",
    label: "Rectangle",
  },
  { id: "oval", icon: "/icons/macpaint/oval.png", label: "Oval" },
];

export const PaintToolbar: React.FC<PaintToolbarProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-0">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === tool.id ? "secondary" : "ghost"}
                className={`p-1 border-1 transition-none ${
                  selectedTool === tool.id ? "invert border-white" : ""
                }`}
                onClick={() => onToolSelect(tool.id)}
              >
                <img
                  src={tool.icon}
                  alt={tool.label}
                  className="w-[36px] h-[36px] object-contain mix-blend-multiply"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={2}>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
