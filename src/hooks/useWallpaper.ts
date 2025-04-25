import { useState, useEffect, useMemo } from "react";
import {
  loadWallpaper,
  saveWallpaper,
  ensureIndexedDBInitialized,
} from "@/utils/storage";

// Store loading state for video wallpapers
const videoLoadingStates: Record<string, boolean> = {};

// Store object URLs to manage their lifecycle
const objectURLs: Record<string, string> = {};

// Constants for IndexedDB
const CUSTOM_WALLPAPERS_STORE = "custom_wallpapers";
const INDEXEDDB_PREFIX = "indexeddb://";

export function useWallpaper() {
  const [currentWallpaper, setCurrentWallpaper] =
    useState<string>(loadWallpaper);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [actualWallpaperData, setActualWallpaperData] = useState<string | null>(
    null
  );

  // Check if current wallpaper is a reference to an IndexedDB item
  const isIndexedDBReference = useMemo(() => {
    return currentWallpaper.startsWith(INDEXEDDB_PREFIX);
  }, [currentWallpaper]);

  // Extract the wallpaper ID from the reference
  const wallpaperId = useMemo(() => {
    return isIndexedDBReference
      ? currentWallpaper.substring(INDEXEDDB_PREFIX.length)
      : null;
  }, [isIndexedDBReference, currentWallpaper]);

  // Check if current wallpaper is a video using useMemo to ensure it's recalculated
  const isVideoWallpaper = useMemo(() => {
    const wallpaperPath = actualWallpaperData || currentWallpaper;
    return (
      wallpaperPath.endsWith(".mp4") ||
      wallpaperPath.includes("video/") ||
      (wallpaperPath.startsWith("https://") &&
        /\.(mp4|webm|ogg)($|\?)/.test(wallpaperPath))
    );
  }, [currentWallpaper, actualWallpaperData]);

  // Cleanup function for object URLs
  const cleanupObjectURLs = () => {
    // Only cleanup URLs that aren't the current one
    Object.entries(objectURLs).forEach(([id, url]) => {
      if (wallpaperId !== id) {
        URL.revokeObjectURL(url);
        delete objectURLs[id];
      }
    });
  };

  // Load wallpaper data from IndexedDB if it's a reference
  useEffect(() => {
    if (isIndexedDBReference && wallpaperId) {
      const loadWallpaperFromIndexedDB = async () => {
        try {
          setIsVideoLoading(true);
          const db = await ensureIndexedDBInitialized();
          try {
            const transaction = db.transaction(
              CUSTOM_WALLPAPERS_STORE,
              "readonly"
            );
            const store = transaction.objectStore(CUSTOM_WALLPAPERS_STORE);
            const request = store.get(wallpaperId);

            request.onsuccess = () => {
              if (request.result) {
                // Create an object URL from the blob data if not already created
                if (!objectURLs[wallpaperId]) {
                  // If we have a Blob, use it directly, otherwise create one from content
                  const blob =
                    request.result.blob ||
                    dataURLToBlob(request.result.content);

                  if (blob) {
                    const objectURL = URL.createObjectURL(blob);
                    objectURLs[wallpaperId] = objectURL;
                    setActualWallpaperData(objectURL);
                  } else {
                    // Fallback to content if blob conversion fails
                    setActualWallpaperData(request.result.content);
                  }
                } else {
                  // Use existing object URL
                  setActualWallpaperData(objectURLs[wallpaperId]);
                }

                // Check if it's a video
                const isVideo =
                  request.result.type?.startsWith("video/") ||
                  request.result.content?.includes("video/");

                if (!isVideo) {
                  setIsVideoLoading(false);
                }

                // Clean up unused object URLs
                cleanupObjectURLs();
              } else {
                console.error("Wallpaper not found in IndexedDB:", wallpaperId);
                setActualWallpaperData(null);
                setIsVideoLoading(false);
              }
              db.close();
            };

            request.onerror = () => {
              console.error(
                "Error loading wallpaper from IndexedDB:",
                request.error
              );
              setActualWallpaperData(null);
              setIsVideoLoading(false);
              db.close();
            };
          } catch (err) {
            console.error("Error accessing wallpaper store:", err);
            setActualWallpaperData(null);
            setIsVideoLoading(false);
            db.close();
          }
        } catch (error) {
          console.error("Failed to open IndexedDB:", error);
          setActualWallpaperData(null);
          setIsVideoLoading(false);
        }
      };

      loadWallpaperFromIndexedDB();
    } else {
      setActualWallpaperData(null);
    }

    // Cleanup object URLs when the component unmounts
    return () => {
      if (!currentWallpaper.startsWith(INDEXEDDB_PREFIX)) {
        cleanupObjectURLs();
      }
    };
  }, [isIndexedDBReference, wallpaperId]);

  // Initialize loading state for video wallpapers
  useEffect(() => {
    if (isVideoWallpaper) {
      const wallpaperPath = actualWallpaperData || currentWallpaper;
      // Only set loading state if it's not already marked as loaded
      if (videoLoadingStates[wallpaperPath] !== false) {
        setIsVideoLoading(true);
        videoLoadingStates[wallpaperPath] = true;
      }
    } else if (!isIndexedDBReference) {
      setIsVideoLoading(false);
    }
  }, [
    currentWallpaper,
    isVideoWallpaper,
    actualWallpaperData,
    isIndexedDBReference,
  ]);

  // Listen for wallpaper changes in localStorage from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "control-panels:wallpaper") {
        setCurrentWallpaper(loadWallpaper());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Helper function to convert a data URL to a Blob
  const dataURLToBlob = (dataURL: string): Blob | null => {
    try {
      if (!dataURL.startsWith("data:")) return null;

      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Error converting data URL to Blob:", e);
      return null;
    }
  };

  // Helper function to check if a video is ready to play
  const checkVideoLoadState = (video: HTMLVideoElement, path: string) => {
    // readyState 4 means HAVE_ENOUGH_DATA - video can be played
    if (video.readyState >= 3) {
      // HAVE_FUTURE_DATA or better
      markVideoLoaded(path);
      return true;
    }
    return false;
  };

  // Helper function to mark a video as loaded
  const markVideoLoaded = (path: string) => {
    videoLoadingStates[path] = false;
    if ((actualWallpaperData || currentWallpaper) === path) {
      setIsVideoLoading(false);
    }
  };

  // Save a custom wallpaper to IndexedDB and return a reference
  const saveCustomWallpaper = async (file: File): Promise<string> => {
    // Validate that the file is an image
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed for custom wallpapers");
    }

    try {
      const db = await ensureIndexedDBInitialized();
      const transaction = db.transaction(CUSTOM_WALLPAPERS_STORE, "readwrite");
      const store = transaction.objectStore(CUSTOM_WALLPAPERS_STORE);

      // Generate a unique name for the wallpaper
      const wallpaperName = `custom_${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )}`;

      // Store the file as a blob directly instead of converting to data URL
      const wallpaper = {
        name: wallpaperName,
        blob: file, // Store the actual blob
        content: "", // Keep this for backwards compatibility
        type: file.type,
        dateAdded: new Date().toISOString(),
      };

      return new Promise((resolve, reject) => {
        const request = store.put(wallpaper);

        request.onsuccess = () => {
          db.close();
          // Return a reference to the stored wallpaper
          resolve(`${INDEXEDDB_PREFIX}${wallpaperName}`);
        };

        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error saving custom wallpaper:", error);
      throw error;
    }
  };

  // Load all custom wallpapers from IndexedDB (just returns references)
  const loadCustomWallpapers = async (): Promise<string[]> => {
    try {
      const db = await ensureIndexedDBInitialized();
      const transaction = db.transaction(CUSTOM_WALLPAPERS_STORE, "readonly");
      const store = transaction.objectStore(CUSTOM_WALLPAPERS_STORE);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result;
          db.close();
          // Convert keys to references
          resolve(
            Array.from(keys as string[]).map(
              (key) => `${INDEXEDDB_PREFIX}${key}`
            )
          );
        };

        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error loading custom wallpapers:", error);
      return [];
    }
  };

  // Get actual data for a specific wallpaper by ID
  const getWallpaperData = async (
    reference: string
  ): Promise<string | null> => {
    if (!reference.startsWith(INDEXEDDB_PREFIX)) {
      return reference; // Not an IndexedDB reference, return as is
    }

    const id = reference.substring(INDEXEDDB_PREFIX.length);

    // If we already have an object URL for this ID, return it
    if (objectURLs[id]) {
      return objectURLs[id];
    }

    try {
      const db = await ensureIndexedDBInitialized();
      const transaction = db.transaction(CUSTOM_WALLPAPERS_STORE, "readonly");
      const store = transaction.objectStore(CUSTOM_WALLPAPERS_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            // If we have a blob, create an object URL
            if (request.result.blob) {
              const objectURL = URL.createObjectURL(request.result.blob);
              objectURLs[id] = objectURL;
              resolve(objectURL);
            }
            // For backwards compatibility with older data
            else if (request.result.content) {
              // Try to convert data URL to blob
              const blob = dataURLToBlob(request.result.content);
              if (blob) {
                const objectURL = URL.createObjectURL(blob);
                objectURLs[id] = objectURL;
                resolve(objectURL);
              } else {
                // Fallback to the content
                resolve(request.result.content);
              }
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
          db.close();
        };

        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error getting wallpaper data:", error);
      return null;
    }
  };

  // Updated setWallpaper to handle file uploads
  const setWallpaper = async (path: string | File) => {
    let wallpaperPath: string;

    // If path is a File, save it to IndexedDB
    if (path instanceof File) {
      try {
        // Check if it's an image before attempting to save
        if (!path.type.startsWith("image/")) {
          console.error("Only image files are allowed for custom wallpapers");
          return;
        }
        wallpaperPath = await saveCustomWallpaper(path);
      } catch (error) {
        console.error("Failed to save custom wallpaper:", error);
        return;
      }
    } else {
      wallpaperPath = path;
    }

    // Update state immediately for the current window
    setCurrentWallpaper(wallpaperPath);
    // Save to localStorage for persistence and other windows
    saveWallpaper(wallpaperPath);
    // Dispatch a custom event for other components in the same window
    window.dispatchEvent(
      new CustomEvent("wallpaperChange", { detail: wallpaperPath })
    );
  };

  // Helper to determine what path to use for the wallpaper source
  const getWallpaperSource = () => {
    return actualWallpaperData || currentWallpaper;
  };

  return {
    currentWallpaper,
    wallpaperSource: getWallpaperSource(),
    setWallpaper,
    isVideoWallpaper,
    isVideoLoading,
    markVideoLoaded,
    checkVideoLoadState,
    saveCustomWallpaper,
    loadCustomWallpapers,
    getWallpaperData,
    INDEXEDDB_PREFIX,
  };
}
