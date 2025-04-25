import { BaseApp } from "../base/types";
import { TextEditAppComponent } from "./components/TextEditAppComponent";

export const helpItems = [
  {
    icon: "📝",
    title: "Basic Editing",
    description: "Type, copy, cut, paste, and undo/redo your text",
  },
  {
    icon: "🎨",
    title: "Text Formatting",
    description:
      "Style with bold, italic, underline, headings, and text alignment",
  },
  {
    icon: "📋",
    title: "Lists & Organization",
    description: "Create bullet, numbered, and task lists to organize content",
  },
  {
    icon: "💾",
    title: "File Management",
    description:
      "Create, open, save, and export files (HTML, MD, TXT) with auto-save",
  },
  {
    icon: "🎤",
    title: "Voice Input",
    description:
      "Dictate text using voice transcription for hands-free editing",
  },
  {
    icon: "⚡",
    title: "Quick Commands",
    description: "Type / to access formatting and editing shortcuts",
  },
];

export const appMetadata = {
  name: "TextEdit",
  version: "1.0.0",
  creator: {
    name: "Kuber",
    url: "https://github.com/kuberwastaken",
  },
  github: "https://github.com/kuberwastaken/Portfolio-UI",
  icon: "/icons/textedit.png",
};

export const TextEditApp: BaseApp = {
  id: "textedit",
  name: "TextEdit",
  icon: { type: "image", src: appMetadata.icon },
  description: "A simple rich text editor",
  component: TextEditAppComponent,
  helpItems,
  metadata: appMetadata,
};
