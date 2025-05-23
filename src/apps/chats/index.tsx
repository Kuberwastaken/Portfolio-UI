import { BaseApp } from "../base/types";
import { ChatsAppComponent } from "./components/ChatsAppComponent";

export const helpItems = [
  {
    icon: "💬",
    title: "Chat",
    description:
      "Type your message and press Enter or click Send to chat with Ryo",
  },
  {
    icon: "🎤",
    title: "Voice",
    description: "Hold Space or tap microphone button to record voice",
  },
  {
    icon: "🎵",
    title: "Sounds",
    description: "Chat synthesizer plays retro sounds while typing",
  },
];

export const appMetadata = {
  name: "Chats",
  version: "1.0.0",
  creator: {
    name: "Kuber",
    url: "https://github.com/kuberwastaken",
  },
  github: "https://github.com/kuberwastaken/Portfolio-UI",
  icon: "/icons/internet.png",
};

export const ChatsApp: BaseApp = {
  id: "chats",
  name: "Chats",
  icon: { type: "image", src: appMetadata.icon },
  description: "Chat with Ryo, your personal AI assistant",
  component: ChatsAppComponent,
  helpItems,
  metadata: appMetadata,
};
