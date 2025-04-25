import { BaseApp } from "../base/types";
import { ControlPanelsAppComponent } from "./components/ControlPanelsAppComponent";

export const helpItems = [
  {
    icon: "🎨",
    title: "Appearance",
    description:
      "Customize your desktop wallpaper with a variety of beautiful photos and patterns",
  },
  {
    icon: "🔊",
    title: "Sound",
    description:
      "Configure UI sounds, typing synth, and chat synthesizer settings",
  },
  {
    icon: "⚙️",
    title: "System",
    description:
      "Backup/restore settings, reset preferences, or format the virtual file system",
  },
];

export const appMetadata = {
  name: "Control Panels",
  version: "1.0.0",
  creator: {
    name: "System",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/control-panels/appearance-manager/app.png",
};

const app: BaseApp = {
  id: "control-panels",
  name: "Control Panels",
  icon: {
    type: "image",
    src: "/icons/control-panels/appearance-manager/app.png",
  },
  description: "System settings and configuration",
  component: ControlPanelsAppComponent,
  helpItems,
  metadata: appMetadata,
};

export default app;
