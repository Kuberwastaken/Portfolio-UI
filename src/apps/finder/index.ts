import { BaseApp } from "../base/types";
import { FinderAppComponent } from "./components/FinderAppComponent";

export const appMetadata = {
  name: "Finder",
  version: "1.0.0",
  creator: {
    name: "Ryo",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/mac.png",
};

export const helpItems = [
  {
    icon: "🔍",
    title: "Browse & Navigate",
    description:
      "Navigate files using Back/Forward buttons and access quick locations from the Go menu",
  },
  {
    icon: "📁",
    title: "File Management",
    description:
      "Create new folders, move files to Trash, and organize your content",
  },
  {
    icon: "👀",
    title: "View & Sort",
    description:
      "Switch between Icon views and sort files by name, kind, size, or date",
  },
  {
    icon: "📍",
    title: "Quick Access",
    description:
      "Quickly access Documents, Applications, and Trash from the Go menu",
  },
  {
    icon: "🗑️",
    title: "Trash",
    description:
      "Move unwanted files to Trash and permanently delete them when emptying",
  },
  {
    icon: "💾",
    title: "Storage Info",
    description:
      "View available storage space and item count at the bottom of the window",
  },
];

export const FinderApp: BaseApp = {
  id: "finder",
  name: "Finder",
  description: "Browse and manage files",
  icon: {
    type: "image",
    src: "/icons/mac.png",
  },
  component: FinderAppComponent,
  helpItems,
  metadata: appMetadata,
};
