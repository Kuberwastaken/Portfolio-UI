import { BaseApp } from "../base/types";
import { SoundboardAppComponent } from "./components/SoundboardAppComponent";

export const helpItems = [
  {
    icon: "🎙️",
    title: "Record",
    description: "Click slot to record, click again to stop",
  },
  {
    icon: "▶️",
    title: "Play",
    description: "Click or push numbers 1-9 to play",
  },
  {
    icon: "✏️",
    title: "Customize",
    description: "Add emojis and name your sounds",
  },
  {
    icon: "📂",
    title: "Organize",
    description: "Make multiple soundboards",
  },
  {
    icon: "🌎",
    title: "Export & share",
    description: "Or import from file downloaded",
  },
  {
    icon: "🖥️",
    title: "Modern GUI",
    description: "System 7 style aesthetics",
  },
];

export const appMetadata = {
  name: "Soundboard",
  version: "0.2",
  creator: {
    name: "Ryo Lu",
    url: "https://ryo.lu",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/cdrom.png",
};

export const SoundboardApp: BaseApp = {
  id: "soundboard",
  name: "Soundboard",
  icon: { type: "image", src: appMetadata.icon },
  description: "A simple soundboard app",
  component: SoundboardAppComponent,
  helpItems,
  metadata: appMetadata,
};
