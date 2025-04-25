import { AppManager } from "./apps/base/AppManager";
import { appRegistry } from "./config/appRegistry";
import { useEffect } from "react";
import { loadDisplayMode, applyDisplayMode } from "./utils/displayMode";

// Convert registry to array
const apps = Object.values(appRegistry);

function App() {
  useEffect(() => {
    const savedMode = loadDisplayMode();
    applyDisplayMode(savedMode);
  }, []);

  return <AppManager apps={apps} />;
}

export default App;
