import { AppId } from "@/config/appRegistry";

interface LaunchAppOptions {
  initialPath?: string;
}

export function useLaunchApp() {
  const launchApp = (appId: AppId, options: LaunchAppOptions = {}) => {
    window.dispatchEvent(
      new CustomEvent("launchApp", {
        detail: {
          appId,
          ...options,
        },
      })
    );
  };

  return launchApp;
}
