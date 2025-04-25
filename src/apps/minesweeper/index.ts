import { BaseApp } from "../base/types";
import { MinesweeperAppComponent } from "./components/MinesweeperAppComponent";

export const appMetadata: BaseApp["metadata"] = {
  name: "Minesweeper",
  version: "1.0.0",
  creator: {
    name: "Kuber",
    url: "https://github.com/kuberwastaken",
  },
  github: "https://github.com/kuberwastaken/Portfolio-UI",
  icon: "/icons/minesweeper.png",
};

export const helpItems: BaseApp["helpItems"] = [
  {
    icon: "🖱️",
    title: "Desktop Controls",
    description:
      "Left click to reveal, right click to flag, double click numbers to reveal adjacent cells.",
  },
  {
    icon: "📱",
    title: "Mobile Controls",
    description: "Tap to reveal, long press to flag.",
  },
  {
    icon: "📖",
    title: "Game Rules",
    description:
      "Numbers show adjacent mines. Flag all mines to win. Double click numbers after flagging neighbors.",
  },
];

export const MinesweeperApp: BaseApp = {
  id: "minesweeper",
  name: "Minesweeper",
  icon: { type: "image", src: "/icons/minesweeper.png" },
  description: "Classic Minesweeper game",
  component: MinesweeperAppComponent,
  helpItems,
  metadata: appMetadata,
};
