import { BaseApp } from "../base/types";
import { SynthAppComponent } from "./components/SynthAppComponent";

export const helpItems = [
  {
    icon: "🎹",
    title: "Virtual Keyboard",
    description: "Play notes using on-screen keyboard or your computer keys",
  },
  {
    icon: "🎛️",
    title: "Oscillators",
    description:
      "Choose between sine, square, sawtooth, and triangle waveforms",
  },
  {
    icon: "🎚️",
    title: "Effects",
    description: "Add reverb, delay, distortion and more to your sound",
  },
  {
    icon: "⚙️",
    title: "Settings",
    description: "Customize synth parameters and MIDI input options",
  },
  {
    icon: "🔊",
    title: "Presets",
    description: "Save and load your favorite synth settings",
  },
  {
    icon: "🎨",
    title: "Retro UI",
    description: "Classic synthesizer aesthetics",
  },
];

export const appMetadata = {
  name: "Synth",
  version: "0.1",
  creator: {
    name: "Ryo Lu",
    url: "https://ryo.lu",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/synth.png",
};

export const SynthApp: BaseApp = {
  id: "synth",
  name: "Synth",
  icon: { type: "image", src: appMetadata.icon },
  description: "A virtual synthesizer with retro aesthetics",
  component: SynthAppComponent,
  helpItems,
  metadata: appMetadata,
};
