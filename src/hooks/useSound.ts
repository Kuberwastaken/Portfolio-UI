import { useCallback, useEffect, useRef } from "react";
import { loadUISoundsEnabled } from "@/utils/storage";

// Global audio context and cache
let audioContext: AudioContext | null = null;
const audioBufferCache = new Map<string, AudioBuffer>();
const activeSources = new Set<AudioBufferSourceNode>();

// Initialize audio context
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Resume audio context - important for iOS
const resumeAudioContext = async () => {
  if (audioContext && audioContext.state === "suspended") {
    try {
      await audioContext.resume();
      console.debug("Audio context resumed");
    } catch (error) {
      console.error("Failed to resume audio context:", error);
    }
  }
};

// Add global event listeners for visibility and focus
if (typeof document !== "undefined" && typeof window !== "undefined") {
  // Handle page visibility change (when app is switched to/from background)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resumeAudioContext();
    }
  });

  // Handle window focus (when app regains focus)
  window.addEventListener("focus", resumeAudioContext);
}

// Preload a single sound and add it to cache
const preloadSound = async (soundPath: string): Promise<AudioBuffer> => {
  if (audioBufferCache.has(soundPath)) {
    return audioBufferCache.get(soundPath)!;
  }

  try {
    const response = await fetch(soundPath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);
    audioBufferCache.set(soundPath, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.error("Error loading sound:", error);
    throw error;
  }
};

// Preload multiple sounds at once
export const preloadSounds = async (sounds: string[]) => {
  await Promise.all(sounds.map(preloadSound));
};

export function useSound(soundPath: string, volume: number = 0.3) {
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Create gain node for volume control
    gainNodeRef.current = getAudioContext().createGain();
    gainNodeRef.current.gain.value = volume;

    // Connect to destination
    gainNodeRef.current.connect(getAudioContext().destination);

    return () => {
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
    };
  }, [volume]);

  const play = useCallback(async () => {
    // Check if UI sounds are enabled
    if (!loadUISoundsEnabled()) {
      return;
    }

    try {
      // Ensure audio context is running before playing
      await resumeAudioContext();
      
      const audioBuffer = await preloadSound(soundPath);
      const source = getAudioContext().createBufferSource();
      source.buffer = audioBuffer;

      // Connect to gain node
      source.connect(gainNodeRef.current!);

      // Set volume
      gainNodeRef.current!.gain.value = volume;

      // Play the sound
      source.start(0);

      // Add to active sources
      activeSources.add(source);

      // Clean up when done
      source.onended = () => {
        activeSources.delete(source);
      };
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [volume, soundPath]);

  // Additional control methods
  const stop = useCallback(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 0;
    }
  }, []);

  const fadeOut = useCallback(
    (duration: number = 0.5) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(
          volume,
          getAudioContext().currentTime
        );
        gainNodeRef.current.gain.linearRampToValueAtTime(
          0,
          getAudioContext().currentTime + duration
        );
      }
    },
    [volume]
  );

  const fadeIn = useCallback(
    (duration: number = 0.5) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(
          0,
          getAudioContext().currentTime
        );
        gainNodeRef.current.gain.linearRampToValueAtTime(
          volume,
          getAudioContext().currentTime + duration
        );
      }
    },
    [volume]
  );

  return { play, stop, fadeOut, fadeIn };
}

// Predefined sound paths for easy access
export const Sounds = {
  ALERT_SOSUMI: "/sounds/AlertSosumi.mp3",
  WINDOW_CLOSE: "/sounds/WindowClose.mp3",
  WINDOW_OPEN: "/sounds/WindowOpen.mp3",
  WINDOW_EXPAND: "/sounds/WindowExpand.mp3",
  WINDOW_COLLAPSE: "/sounds/WindowCollapse.mp3",
  BUTTON_CLICK: "/sounds/ButtonClickDown.mp3",
  MENU_OPEN: "/sounds/MenuOpen.mp3",
  MENU_CLOSE: "/sounds/MenuClose.mp3",
  // Window movement and resize sounds
  WINDOW_MOVE_MOVING: "/sounds/WindowMoveMoving.mp3",
  WINDOW_MOVE_STOP: "/sounds/WindowMoveStop.mp3",
  WINDOW_RESIZE_RESIZING: "/sounds/WindowResizeResizing.mp3",
  WINDOW_RESIZE_STOP: "/sounds/WindowResizeStop.mp3",
  // Minesweeper sounds
  CLICK: "/sounds/Click.mp3",
  ALERT_BONK: "/sounds/AlertBonk.mp3",
  ALERT_INDIGO: "/sounds/AlertIndigo.mp3",
  MSN_NUDGE: "/sounds/MSNNudge.mp3",
  // Video player sounds
  VIDEO_TAPE: "/sounds/VideoTapeIn.mp3",
  // Photo booth sounds
  PHOTO_SHUTTER: "/sounds/PhotoShutter.mp3",
} as const;

// Preload all predefined sounds
preloadSounds(Object.values(Sounds));
