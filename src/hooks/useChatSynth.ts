import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { loadSynthPreset } from "@/utils/storage";
import { useVibration } from './useVibration';

export type SynthPreset = {
  name: string;
  oscillator: {
    type: OscillatorType;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  effects: {
    filter: {
      frequency: number;
      rolloff: -12 | -24 | -48 | -96;
    };
    tremolo: {
      frequency: number;
      depth: number;
    };
    reverb: {
      decay: number;
      wet: number;
    };
  };
};

// Define valid oscillator types
type OscillatorType = "triangle" | "sine" | "square" | "sawtooth";

export const SYNTH_PRESETS: Record<string, SynthPreset> = {
  classic: {
    name: "Classic",
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.2,
      release: 0.3,
    },
    effects: {
      filter: {
        frequency: 2000,
        rolloff: -12,
      },
      tremolo: {
        frequency: 0.8,
        depth: 0.3,
      },
      reverb: {
        decay: 1.5,
        wet: 0.6,
      },
    },
  },
  ethereal: {
    name: "Ethereal",
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 0.1,
      decay: 0.4,
      sustain: 0.4,
      release: 0.8,
    },
    effects: {
      filter: {
        frequency: 3000,
        rolloff: -24,
      },
      tremolo: {
        frequency: 0.5,
        depth: 0.5,
      },
      reverb: {
        decay: 2.5,
        wet: 0.8,
      },
    },
  },
  digital: {
    name: "Digital",
    oscillator: {
      type: "square",
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.1,
      release: 0.1,
    },
    effects: {
      filter: {
        frequency: 4000,
        rolloff: -12,
      },
      tremolo: {
        frequency: 1.2,
        depth: 0.2,
      },
      reverb: {
        decay: 0.8,
        wet: 0.3,
      },
    },
  },
  retro: {
    name: "Retro",
    oscillator: {
      type: "sawtooth",
    },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.3,
      release: 0.4,
    },
    effects: {
      filter: {
        frequency: 1500,
        rolloff: -24,
      },
      tremolo: {
        frequency: 0.6,
        depth: 0.4,
      },
      reverb: {
        decay: 1.2,
        wet: 0.5,
      },
    },
  },
};

// Pentatonic scale for an exotic jungle feel
const notes = ["C4", "D4", "F4", "G4", "A4", "C5", "D5"];
const minTimeBetweenNotes = 0.1;

export function useChatSynth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPreset] = useState<string>(
    () => loadSynthPreset() || "classic"
  );
  const lastNoteTimeRef = useRef(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const vibrate = useVibration(50, 30);

  // Initialize synth on mount
  useEffect(() => {
    synthRef.current = createSynth(SYNTH_PRESETS[currentPreset]);
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  const initializeTone = useCallback(async () => {
    if (!isInitialized) {
      await Tone.start();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeTone();
      window.removeEventListener("click", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction);
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, [initializeTone]);

  const changePreset = useCallback((presetKey: string) => {
    if (SYNTH_PRESETS[presetKey]) {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      synthRef.current = createSynth(SYNTH_PRESETS[presetKey]);
      console.log("Preset changed to", presetKey);
    }
  }, []);

  const playNote = useCallback(() => {
    if (!isInitialized || Tone.context.state !== "running" || !synthRef.current)
      return;

    const now = Tone.now();
    if (now - lastNoteTimeRef.current >= minTimeBetweenNotes) {
      const noteToPlay = notes[Math.floor(Math.random() * notes.length)];
      try {
        synthRef.current.triggerAttackRelease(noteToPlay, "32n", now);
        vibrate();
        lastNoteTimeRef.current = now;
      } catch (error) {
        console.debug("Skipping note due to timing", error);
      }
    }
  }, [isInitialized, vibrate]);

  return { playNote, currentPreset, changePreset };
}

function createSynth(preset: SynthPreset) {
  // Create effects chain
  const filter = new Tone.Filter({
    frequency: preset.effects.filter.frequency,
    type: "lowpass",
    rolloff: preset.effects.filter.rolloff as -12 | -24 | -48 | -96,
  }).toDestination();

  const tremolo = new Tone.Tremolo({
    frequency: preset.effects.tremolo.frequency,
    depth: preset.effects.tremolo.depth,
  })
    .connect(filter)
    .start();

  const reverb = new Tone.Reverb({
    decay: preset.effects.reverb.decay,
    wet: preset.effects.reverb.wet,
  }).connect(tremolo);

  const newSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: preset.oscillator,
    envelope: preset.envelope,
  }).connect(reverb);

  newSynth.volume.value = -12;
  return newSynth;
}
