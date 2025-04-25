import { BaseApp } from "../base/types";
import { PhotoBoothComponent } from "./components/PhotoBoothComponent";

export const appMetadata = {
  name: "Photo Booth",
  version: "1.0.0",
  creator: {
    name: "Ryo",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/photo-booth.png",
};

export const helpItems = [
  {
    icon: "📸",
    title: "Taking Photos",
    description:
      "Click the 'Take Photo' button to capture an image from your camera.",
  },
  {
    icon: "🎨",
    title: "Effects",
    description:
      "Use the effect dropdown to apply different filters to your photos.",
  },
  {
    icon: "⚡",
    title: "Adjustments",
    description:
      "Use the brightness and contrast sliders to fine-tune your photos.",
  },
  {
    icon: "🖼️",
    title: "Photo Gallery",
    description:
      "Your captured photos appear in the gallery at the bottom of the window.",
  },
];

export const PhotoBoothApp: BaseApp = {
  id: "photo-booth",
  name: "Photo Booth",
  icon: { type: "image", src: "/icons/photo-booth.png" },
  description: "Take photos with your camera and apply fun effects",
  component: PhotoBoothComponent,
  helpItems,
  metadata: appMetadata,
};
