import React from "react";

export interface AppProps {
  onClose: () => void;
  isWindowOpen: boolean;
  isForeground?: boolean;
  className?: string;
  helpItems?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export interface BaseApp {
  id:
    | "soundboard"
    | "internet-explorer"
    | "chats"
    | "textedit"
    | "control-panels"
    | "minesweeper"
    | "finder"
    | "paint"
    | "videos"
    | "pc"
    | "photo-booth"
    | "synth"
    | "ipod"
    | "terminal";
  name: string;
  icon: string | { type: "image"; src: string };
  description: string;
  component: React.ComponentType<AppProps>;
  windowConstraints?: {
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
  helpItems?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  metadata?: {
    name: string;
    version: string;
    creator: {
      name: string;
      url: string;
    };
    github: string;
    icon: string;
  };
}

export interface AppState {
  isOpen: boolean;
  position?: { x: number; y: number };
  isForeground?: boolean;
}

export interface AppManagerState {
  windowOrder: string[];
  apps: {
    [appId: string]: AppState;
  };
}
