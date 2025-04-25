import { BaseApp } from "../base/types";
import { TerminalAppComponent } from "./components/TerminalAppComponent";

export const TerminalApp: BaseApp = {
  id: "terminal",
  name: "Terminal",
  icon: {
    type: "image",
    src: "/icons/terminal.png",
  },
  description: "A Unix-like terminal for interacting with the system",
  component: TerminalAppComponent,
  helpItems: [
    {
      icon: "💻",
      title: "Basic Commands",
      description:
        "Use commands like ls, cd, cat, pwd, and clear to navigate and view files.",
    },
    {
      icon: "🧭",
      title: "Navigation",
      description:
        "The terminal allows you to browse the same file system as Finder.",
    },
    {
      icon: "⌨️",
      title: "Command History",
      description:
        "Press Up and Down arrow keys to cycle through previous commands.",
    },
    {
      icon: "🔊",
      title: "Terminal Sounds",
      description:
        "Enable or disable retro typing sounds in Control Panels > Sound.",
    },
  ],
  metadata: {
    name: "Terminal",
    version: "1.0.0",
    creator: {
      name: "Kuber",
      url: "https://github.com/kuberwastaken",
    },
    github: "https://github.com/kuberwastaken/Portfolio-UI",
    icon: "/icons/terminal.png",
  },
};

export const appMetadata = TerminalApp.metadata;
export const helpItems = TerminalApp.helpItems;
