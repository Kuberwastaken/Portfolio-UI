import { BaseApp } from "../base/types";
import { PcAppComponent } from "./components/PcAppComponent";

export const appMetadata = {
  name: "Virtual PC",
  version: "1.0.0",
  creator: {
    name: "Ryo",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/pc.png",
};

export const helpItems = [
  {
    icon: "🎮",
    title: "PC Emulator",
    description: "Run classic DOS games and applications in your browser",
  },
  {
    icon: "⌨️",
    title: "Keyboard Controls",
    description: "Use your keyboard to control the DOS environment",
  },
  {
    icon: "💾",
    title: "Save States",
    description: "Save and load your game progress",
  },
];

export const PcApp: BaseApp = {
  id: "pc",
  name: "Virtual PC",
  icon: { type: "image", src: "/icons/pc.png" },
  description: "DOSBox Emulator",
  component: PcAppComponent,
  windowConstraints: {
    minWidth: 640,
    minHeight: 480,
  },
  helpItems,
  metadata: appMetadata,
};
