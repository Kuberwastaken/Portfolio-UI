import { PaintAppComponent } from "./components/PaintAppComponent";
import type { BaseApp } from "../base/types";

export const helpItems = [
  {
    icon: "✏️",
    title: "Drawing Tools",
    description:
      "Use the toolbar on the left to select different drawing tools like pencil, brush, shapes, and more.",
  },
  {
    icon: "🎨",
    title: "Colors",
    description:
      "Select colors from the palette below the tools to change your drawing color.",
  },
  {
    icon: "↩️",
    title: "Undo",
    description: "Press ⌘Z or use Edit > Undo to undo your last action.",
  },
  {
    icon: "💾",
    title: "Saving",
    description:
      "Use File > Save to save your artwork, or File > Save As to save it with a new name.",
  },
  {
    icon: "🔲",
    title: "Patterns",
    description:
      "Choose from various patterns in the bottom palette to fill shapes and areas.",
  },
  {
    icon: "⭕",
    title: "Shapes",
    description:
      "Draw rectangles, ovals, and lines using the shape tools in the toolbar.",
  },
];

export const appMetadata = {
  name: "MacPaint",
  version: "1.0.4",
  creator: {
    name: "Ryo Lu",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/paint.png",
};

export const PaintApp: BaseApp = {
  id: "paint",
  name: "MacPaint",
  icon: { type: "image", src: "/icons/paint.png" },
  description: "Classic MacPaint-style drawing application",
  component: PaintAppComponent,
  helpItems,
  metadata: appMetadata,
};
