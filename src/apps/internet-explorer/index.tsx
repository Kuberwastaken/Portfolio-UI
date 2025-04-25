import { BaseApp } from "../base/types";
import { InternetExplorerAppComponent } from "./components/InternetExplorerAppComponent";

export const helpItems = [
  {
    icon: "🌐",
    title: "Browse",
    description: "Enter URLs to browse the web",
  },
  {
    icon: "⭐",
    title: "Favorites",
    description: "Save and manage your favorite sites",
  },
  {
    icon: "🔄",
    title: "Load and refresh",
    description: "Open iframable websites",
  },
];

export const appMetadata = {
  version: "1.02",
  name: "Internet Explorer",
  creator: {
    name: "Ryo Lu",
    url: "https://ryo.lu",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/ie.png",
};

export const InternetExplorerApp: BaseApp = {
  id: "internet-explorer",
  name: "Internet Explorer",
  icon: { type: "image", src: appMetadata.icon },
  description: "Browse the web like it's 1999",
  component: InternetExplorerAppComponent,
  helpItems,
  metadata: appMetadata,
};
