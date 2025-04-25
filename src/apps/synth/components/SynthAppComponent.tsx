import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { AppProps } from "../../base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { SynthMenuBar } from "./SynthMenuBar";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { InputDialog } from "@/components/dialogs/InputDialog";
import { helpItems, appMetadata } from "..";
import {
  loadSynthPresets,
  saveSynthPresets,
  loadSynthCurrentPreset,
  saveSynthCurrentPreset,
  loadSynthLabelType,
  saveSynthLabelType,
  APP_STORAGE_KEYS,
  SynthPreset,
} from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dial } from "@/components/ui/dial";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Waveform3D } from "./Waveform3D";

// Define oscillator type
type OscillatorType = "sine" | "square" | "triangle" | "sawtooth";

// Define label type
type NoteLabelType = "note" | "key" | "off";

// Function to shift note by octave
const shiftNoteByOctave = (note: string, offset: number): string => {
  const noteMatch = note.match(/([A-G]#?)(\d+)/);
  if (!noteMatch) return note;

  const [, noteName, octave] = noteMatch;
  const newOctave = parseInt(octave) + offset;

  // Limit octave range to prevent invalid notes
  if (newOctave < 0 || newOctave > 8) return note;

  return `${noteName}${newOctave}`;
};

// Component to display status messages
const StatusDisplay: React.FC<{ message: string | null }> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-4 w-full text-center left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-sm text-[#ff00ff] text-[12px] font-geneva-12 z-10 select-none"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Piano key component
const PianoKey: React.FC<{
  note: string;
  isBlack?: boolean;
  isPressed?: boolean;
  onPress: (note: string) => void;
  onRelease: (note: string) => void;
  labelType: NoteLabelType;
  keyMap: Record<string, string>;
  octaveOffset: number;
}> = ({
  note,
  isBlack = false,
  isPressed = false,
  onPress,
  onRelease,
  labelType,
  keyMap,
  octaveOffset,
}) => {
  const handleMouseDown = () => {
    onPress(note);
  };

  const handleMouseUp = () => {
    onRelease(note);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      onPress(note);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      onRelease(note);
    }
  };

  // Get the appropriate label based on labelType
  const getKeyLabel = () => {
    if (labelType === "off") return "";
    if (labelType === "key") {
      // Find the keyboard key for this note
      const keyboardKey = Object.entries(keyMap).find(
        ([, noteValue]) => noteValue === note
      )?.[0];
      return keyboardKey ? keyboardKey.toUpperCase() : "";
    }
    // Include the octave number in the note label, adjusted for octaveOffset
    if (octaveOffset !== 0) {
      // Apply octave shift to display the actual note being played
      const shiftedNote = shiftNoteByOctave(note, octaveOffset);
      return shiftedNote;
    }
    return note;
  };

  const label = getKeyLabel();

  return (
    <button
      type="button"
      data-note={note}
      className={cn(
        "relative touch-none select-none outline-none transition-colors duration-100",
        isBlack
          ? cn(
              "absolute top-0 left-[65%] w-[74%] h-[70%] rounded-b-md z-10",
              isPressed ? "bg-[#ff33ff]" : "bg-black hover:bg-[#333333]"
            )
          : cn(
              "h-full w-full border border-[#333333] rounded-b-md",
              isPressed ? "bg-[#ff33ff]" : "bg-white hover:bg-[#f5f5f5]"
            )
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {label && (
        <span
          className={cn(
            "absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] pointer-events-none font-geneva-12 select-none",
            isBlack ? "text-white" : "text-black"
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
};

// Main synth app component
export function SynthAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
}: AppProps) {
  // References and synth state
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const gainRef = useRef<Tone.Gain | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const phaserRef = useRef<Tone.Phaser | null>(null);
  const bitcrusherRef = useRef<Tone.BitCrusher | null>(null);

  // UI state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [isSavingNewPreset, setIsSavingNewPreset] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState(0);

  // Default presets
  const defaultPresets: SynthPreset[] = [
    {
      id: "default",
      name: "Synth",
      oscillator: {
        type: "sine" as OscillatorType,
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 1,
      },
      effects: {
        reverb: 0.2,
        delay: 0.2,
        distortion: 0,
        gain: 0.8,
        chorus: 0,
        phaser: 0,
        bitcrusher: 0,
      },
    },
    {
      id: "piano",
      name: "Piano",
      oscillator: {
        type: "sine" as OscillatorType,
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.1,
        release: 0.5,
      },
      effects: {
        reverb: 0.4,
        delay: 0.1,
        distortion: 0,
        gain: 0.7,
        chorus: 0.2,
        phaser: 0,
        bitcrusher: 0,
      },
    },
    {
      id: "analog-pad",
      name: "Pad",
      oscillator: {
        type: "triangle" as OscillatorType,
      },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 2,
      },
      effects: {
        reverb: 0.6,
        delay: 0.3,
        distortion: 0,
        gain: 0.6,
        chorus: 0.4,
        phaser: 0,
        bitcrusher: 0,
      },
    },
    {
      id: "digital-lead",
      name: "Lead",
      oscillator: {
        type: "sawtooth" as OscillatorType,
      },
      envelope: {
        attack: 0.02,
        decay: 0.6,
        sustain: 0.5,
        release: 0.5,
      },
      effects: {
        reverb: 0.5,
        delay: 0.25,
        distortion: 0.0,
        gain: 0.2,
        chorus: 0.1,
        phaser: 0.1,
        bitcrusher: 0.4,
      },
    },
  ];

  const [presets, setPresets] = useState<SynthPreset[]>(() => {
    try {
      // Try to load saved presets on initial render
      const savedPresets = loadSynthPresets();
      if (savedPresets && savedPresets.length > 0) {
        // Add default gain to presets that don't have it
        return savedPresets.map((preset) => ({
          ...preset,
          effects: {
            ...preset.effects,
            gain: preset.effects.gain ?? 0.8, // Default to 0.8 if gain is missing
          },
        }));
      }
      return [...defaultPresets];
    } catch (error) {
      console.error("Error loading presets:", error);
      return [...defaultPresets];
    }
  });

  const [currentPreset, setCurrentPreset] = useState<SynthPreset>(() => {
    try {
      // Try to load saved current preset on initial render
      const savedCurrentPreset = loadSynthCurrentPreset();
      const savedPresets = loadSynthPresets();
      if (
        savedCurrentPreset &&
        savedPresets?.find((p) => p.id === savedCurrentPreset.id)
      ) {
        // Add default gain if missing
        return {
          ...savedCurrentPreset,
          effects: {
            ...savedCurrentPreset.effects,
            gain: savedCurrentPreset.effects.gain ?? 0.8, // Default to 0.8 if gain is missing
          },
        };
      }
      // Fall back to first preset if no valid saved current preset
      return savedPresets && savedPresets.length > 0
        ? {
            ...savedPresets[0],
            effects: {
              ...savedPresets[0].effects,
              gain: savedPresets[0].effects.gain ?? 0.8,
            },
          }
        : { ...defaultPresets[0] };
    } catch (error) {
      console.error("Error loading current preset:", error);
      return { ...defaultPresets[0] };
    }
  });

  const [pressedNotes, setPressedNotes] = useState<Record<string, boolean>>({});
  const [activeTouches, setActiveTouches] = useState<Record<string, string>>(
    {}
  );
  // Use UI sound for interface feedback
  const { play } = useSound("/sounds/click.mp3");

  // Define keyboard layout with extended range
  const allWhiteKeys = [
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "A3",
    "B3",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
  ];
  const allBlackKeys = [
    "C#3",
    "D#3",
    null,
    "F#3",
    "G#3",
    "A#3",
    null,
    "C#4",
    "D#4",
    null,
    "F#4",
    "G#4",
    "A#4",
    null,
    "C#5",
    "D#5",
    null,
    "F#5",
  ];

  // State for responsive keyboard
  const [visibleKeyCount, setVisibleKeyCount] = useState(8);

  // Reference to the app container
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Update visible keys based on WindowFrame's width
  useEffect(() => {
    if (!isWindowOpen) return;

    const handleResize = () => {
      if (!appContainerRef.current) return;

      const width = appContainerRef.current.clientWidth;
      // Calculate how many additional keys to show based on width
      // Base is 8 keys at minimum width (e.g. 400px)
      // Add 1 key per 80px of additional width
      const additionalKeys = Math.floor((width - 400) / 80);
      setVisibleKeyCount(Math.max(0, Math.min(10, additionalKeys)));
    };

    // Initial calculation
    handleResize();

    // Create ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(handleResize);

    if (appContainerRef.current) {
      resizeObserver.observe(appContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isWindowOpen, appContainerRef.current]);

  // Get visible keys based on container width
  // Start with a base of 8 keys (C4-C5) and add more keys on both sides as container gets wider
  const baseIndex = 7; // Index of C4 in allWhiteKeys
  const keysToAddLeft = Math.floor(visibleKeyCount / 2);
  const keysToAddRight = Math.ceil(visibleKeyCount / 2);

  const startIndex = Math.max(0, baseIndex - keysToAddLeft);
  const endIndex = Math.min(
    allWhiteKeys.length,
    baseIndex + 8 + keysToAddRight
  );

  const whiteKeys = allWhiteKeys.slice(startIndex, endIndex);
  const blackKeys = allBlackKeys.slice(startIndex, endIndex);

  // Determine default label type based on screen size
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [labelType, setLabelType] = useState<NoteLabelType>(() => {
    // Load saved label type, fallback to "off" as default
    const savedLabelType = loadSynthLabelType();
    return savedLabelType || "off";
  });

  // Update label type when screen size changes and save when changed
  useEffect(() => {
    if (!isWindowOpen) return;

    // Only update to default if no saved preference exists
    if (!localStorage.getItem(APP_STORAGE_KEYS.synth.LABEL_TYPE)) {
      setLabelType("off");
    }
  }, [isMobile, isWindowOpen]);

  // Save label type when it changes
  useEffect(() => {
    if (!isWindowOpen) return;
    saveSynthLabelType(labelType);
  }, [labelType, isWindowOpen]);

  // Initialize synth and effects
  useEffect(() => {
    if (!isWindowOpen) return;

    // Create synth and effects chain
    const synth = new Tone.PolySynth(Tone.Synth);
    const reverb = new Tone.Reverb({
      decay: 2,
      wet: currentPreset.effects.reverb,
    });
    const delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: currentPreset.effects.delay,
    });
    const distortion = new Tone.Distortion({
      distortion: currentPreset.effects.distortion,
    });
    const gain = new Tone.Gain(currentPreset.effects.gain);
    const chorus = new Tone.Chorus({
      frequency: 4,
      delayTime: 2.5,
      depth: 0.7,
    }).start();
    chorus.wet.value = currentPreset.effects.chorus ?? 0;

    const phaser = new Tone.Phaser({
      frequency: 0.5,
      octaves: 3,
      baseFrequency: 1000,
      wet: currentPreset.effects.phaser ?? 0,
    });

    const bitcrusher = new Tone.BitCrusher(4).set({
      bits: Math.floor(4 + (1 - (currentPreset.effects.bitcrusher ?? 0)) * 12),
    });
    // Add a boost gain before analyzer for better visualization
    const analyzerBoost = new Tone.Gain(4);
    const analyzer = new Tone.Analyser({
      type: "waveform",
      size: 1024,
      smoothing: 0.8,
    });

    // Connect effects chain
    synth.connect(reverb);
    reverb.connect(delay);
    delay.connect(distortion);
    distortion.connect(chorus);
    chorus.connect(phaser);
    phaser.connect(bitcrusher);
    bitcrusher.connect(gain);
    gain.connect(analyzerBoost);
    analyzerBoost.connect(analyzer);
    gain.connect(Tone.Destination);

    // Set initial synth parameters
    synth.set({
      oscillator: {
        type: currentPreset.oscillator.type,
      },
      envelope: {
        attack: currentPreset.envelope.attack,
        decay: currentPreset.envelope.decay,
        sustain: currentPreset.envelope.sustain,
        release: currentPreset.envelope.release,
      },
    });

    synthRef.current = synth;
    reverbRef.current = reverb;
    delayRef.current = delay;
    distortionRef.current = distortion;
    gainRef.current = gain;
    chorusRef.current = chorus;
    phaserRef.current = phaser;
    bitcrusherRef.current = bitcrusher;
    analyzerRef.current = analyzer;

    // Initialize synth with current preset
    updateSynthParams(currentPreset);

    // Add keyboard event handlers
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      synth.dispose();
      reverb.dispose();
      delay.dispose();
      distortion.dispose();
      chorus.dispose();
      phaser.dispose();
      bitcrusher.dispose();
      gain.dispose();
      analyzer.dispose();
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isWindowOpen]);

  // Save presets when they change
  useEffect(() => {
    if (!isWindowOpen) return;
    if (presets.length > 0) {
      saveSynthPresets(presets);
    }
  }, [presets, isWindowOpen]);

  // Save current preset when it changes
  useEffect(() => {
    if (!isWindowOpen) return;
    saveSynthCurrentPreset(currentPreset);
  }, [currentPreset, isWindowOpen]);

  // Update synth parameters when current preset changes
  const updateSynthParams = (preset: SynthPreset) => {
    if (
      !synthRef.current ||
      !reverbRef.current ||
      !delayRef.current ||
      !distortionRef.current ||
      !gainRef.current ||
      !chorusRef.current ||
      !phaserRef.current ||
      !bitcrusherRef.current
    )
      return;

    synthRef.current.set({
      oscillator: {
        type: preset.oscillator.type,
      },
      envelope: {
        attack: preset.envelope.attack,
        decay: preset.envelope.decay,
        sustain: preset.envelope.sustain,
        release: preset.envelope.release,
      },
    });

    reverbRef.current.wet.value = preset.effects.reverb;
    delayRef.current.feedback.value = preset.effects.delay;
    distortionRef.current.distortion = preset.effects.distortion;
    gainRef.current.gain.value = preset.effects.gain;

    // Update chorus parameters safely
    if (chorusRef.current.wet) {
      chorusRef.current.wet.value = preset.effects.chorus ?? 0;
    }

    // Update phaser parameters safely
    if (phaserRef.current.wet) {
      phaserRef.current.wet.value = preset.effects.phaser ?? 0;
    }

    // Update bitcrusher parameters
    bitcrusherRef.current.set({
      bits: Math.floor(4 + (1 - (preset.effects.bitcrusher ?? 0)) * 12),
    });
  };

  // Keyboard event handlers - extended mapping
  const keyToNoteMap: Record<string, string> = {
    // Middle octave (C4-B4)
    a: "C4",
    w: "C#4",
    s: "D4",
    e: "D#4",
    d: "E4",
    f: "F4",
    t: "F#4",
    g: "G4",
    y: "G#4",
    h: "A4",
    u: "A#4",
    j: "B4",

    // Upper octave (C5-F5)
    k: "C5",
    o: "C#5",
    l: "D5",
    p: "D#5",
    ";": "E5",
    "'": "F5",
  };

  // Note press/release handlers
  const pressNote = (note: string) => {
    if (!synthRef.current) return;

    const shiftedNote = shiftNoteByOctave(note, octaveOffset);
    const now = Tone.context.currentTime; // schedule without extra latency
    synthRef.current.triggerAttack(shiftedNote, now);
    setPressedNotes((prev) => ({ ...prev, [note]: true }));
  };

  const releaseNote = (note: string) => {
    if (!synthRef.current) return;

    const shiftedNote = shiftNoteByOctave(note, octaveOffset);
    const now = Tone.context.currentTime;
    synthRef.current.triggerRelease(shiftedNote, now);
    setPressedNotes((prev) => ({ ...prev, [note]: false }));
  };

  // Status message display
  const showStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Preset handlers
  const addPreset = () => {
    setIsSavingNewPreset(true);
    setPresetName("");
    setIsPresetDialogOpen(true);
    play();
  };

  const savePreset = (name: string) => {
    if (isSavingNewPreset) {
      // Create a new preset
      const newPreset: SynthPreset = {
        ...currentPreset,
        id: Date.now().toString(),
        name,
      };

      setPresets((prev) => [...prev, newPreset]);
      setCurrentPreset(newPreset);
      showStatus(`Preset "${name}" saved`);
    } else {
      // Update existing preset
      const updatedPreset: SynthPreset = {
        ...currentPreset,
        name: name,
      };

      setPresets((prev) =>
        prev.map((preset) =>
          preset.id === currentPreset.id ? updatedPreset : preset
        )
      );
      setCurrentPreset(updatedPreset);
      showStatus(`Preset "${name}" updated`);
    }
    setIsPresetDialogOpen(false);
  };

  const loadPreset = (preset: SynthPreset) => {
    setCurrentPreset(preset);
    updateSynthParams(preset);
    showStatus(`Preset "${preset.name}" loaded`);
    play();
  };

  const resetSynth = () => {
    // Set the presets and current preset
    const resetPresets = [...defaultPresets]; // Create a new array to trigger state update
    setPresets(resetPresets);
    setCurrentPreset(resetPresets[0]);
    updateSynthParams(resetPresets[0]);

    // Clear any saved presets
    saveSynthPresets(resetPresets);
    saveSynthCurrentPreset(resetPresets[0]);

    showStatus("Synth reset to defaults");
    play();
  };

  // Parameter change handlers with autosave
  const handleOscillatorChange = (type: OscillatorType) => {
    const updatedPreset = {
      ...currentPreset,
      oscillator: { type },
    };
    setCurrentPreset(updatedPreset);
    updateSynthParams(updatedPreset);

    // Update and save presets
    const updatedPresets = presets.map((p) =>
      p.id === updatedPreset.id ? updatedPreset : p
    );
    setPresets(updatedPresets);
    saveSynthPresets(updatedPresets);
    saveSynthCurrentPreset(updatedPreset);
  };

  const handleEnvelopeChange = (
    param: "attack" | "decay" | "sustain" | "release",
    value: number
  ) => {
    const updatedPreset = {
      ...currentPreset,
      envelope: {
        ...currentPreset.envelope,
        [param]: value,
      },
    };
    setCurrentPreset(updatedPreset);
    updateSynthParams(updatedPreset);

    // Update and save presets
    const updatedPresets = presets.map((p) =>
      p.id === updatedPreset.id ? updatedPreset : p
    );
    setPresets(updatedPresets);
    saveSynthPresets(updatedPresets);
    saveSynthCurrentPreset(updatedPreset);
  };

  const handleEffectChange = (
    effect:
      | "reverb"
      | "delay"
      | "distortion"
      | "gain"
      | "chorus"
      | "phaser"
      | "bitcrusher",
    value: number
  ) => {
    const updatedPreset = {
      ...currentPreset,
      effects: {
        ...currentPreset.effects,
        [effect]: value,
      },
    };
    setCurrentPreset(updatedPreset);
    updateSynthParams(updatedPreset);

    // Update and save presets
    const updatedPresets = presets.map((p) =>
      p.id === updatedPreset.id ? updatedPreset : p
    );
    setPresets(updatedPresets);
    saveSynthPresets(updatedPresets);
    saveSynthCurrentPreset(updatedPreset);
  };

  // Keyboard event handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      !isForeground ||
      e.repeat ||
      isPresetDialogOpen ||
      isHelpOpen ||
      isAboutOpen ||
      isControlsVisible
    )
      return;

    // Handle octave shift keys
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      setOctaveOffset((prevOffset) => {
        const newOffset = Math.max(-2, prevOffset - 1);
        showStatus(`Octave ${newOffset}`);
        return newOffset;
      });
    } else if (e.key === "=" || e.key === "+") {
      e.preventDefault();
      setOctaveOffset((prevOffset) => {
        const newOffset = Math.min(2, prevOffset + 1);
        showStatus(`Octave ${newOffset}`);
        return newOffset;
      });
    }

    // Handle number keys for preset switching
    const numKey = parseInt(e.key);
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
      e.preventDefault();
      const presetIndex = numKey - 1;
      if (presetIndex < presets.length) {
        loadPreset(presets[presetIndex]);
      }
    }

    // Handle 0 key for the 10th preset
    if (e.key === "0") {
      e.preventDefault();
      const presetIndex = 9;
      if (presetIndex < presets.length) {
        loadPreset(presets[presetIndex]);
      }
    }

    const note = keyToNoteMap[e.key.toLowerCase()];
    if (note) {
      e.preventDefault();
      pressNote(note);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (
      !isForeground ||
      isPresetDialogOpen ||
      isHelpOpen ||
      isAboutOpen ||
      isControlsVisible
    )
      return;

    const note = keyToNoteMap[e.key.toLowerCase()];
    if (note) {
      e.preventDefault();
      releaseNote(note);
    }
  };

  // Add visibility change effect to release notes when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Release all active notes when the app goes to background
        Object.entries(activeTouches).forEach(([, note]) => {
          releaseNote(note);
        });
        setActiveTouches({});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTouches, releaseNote]);

  // Ensure Tone.js context is in low-latency mode once when the component mounts
  useEffect(() => {
    // Tone.js adds a small scheduling lookAhead (default 0.1 s) which can make the
    // keyboard feel sluggish.  Setting it to 0 removes the intentional delay so
    // that notes are triggered immediately when requested.
    try {
      // In some environments Tone.context might not be ready yet, so we wrap in try/catch
      if (Tone && Tone.context) {
        // @ts-ignore – Tone's type defs don't expose lookAhead as writable
        Tone.context.lookAhead = 0;
      }
    } catch {
      // Ignore if Tone isn't available – worst case we keep the default value.
    }
  }, []);

  return (
    <>
      <SynthMenuBar
        onAddPreset={addPreset}
        onShowHelp={() => setIsHelpOpen(true)}
        onShowAbout={() => setIsAboutOpen(true)}
        onReset={resetSynth}
        onClose={onClose}
        presets={presets}
        currentPresetId={currentPreset.id}
        onLoadPresetById={(id) => {
          const preset = presets.find((p) => p.id === id);
          if (preset) loadPreset(preset);
        }}
        labelType={labelType}
        onLabelTypeChange={setLabelType}
      />

      <WindowFrame
        title="Synth"
        appId="synth"
        onClose={onClose}
        isForeground={isForeground}
      >
        <div
          ref={appContainerRef}
          className="flex flex-col h-full w-full bg-[#1a1a1a] text-white overflow-hidden select-none"
        >
          {/* Main content area */}
          <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
            {/* Presets section */}
            <div className="p-4 py-4 pb-3 bg-[#2a2a2a] w-full border-b border-[#3a3a3a] z-[50] relative">
              <div className="flex justify-between items-center">
                <div className="flex gap-0 overflow-x-auto">
                  {/* Mobile preset selector */}
                  <div className="md:hidden w-48">
                    <Select
                      value={currentPreset.id}
                      onValueChange={(value) => {
                        const preset = presets.find((p) => p.id === value);
                        if (preset) loadPreset(preset);
                      }}
                    >
                      <SelectTrigger className="w-full bg-black border-[#3a3a3a] text-white font-geneva-12 text-[12px] p-2">
                        <SelectValue placeholder="Select Preset" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-[#3a3a3a] text-white">
                        {presets.map((preset) => (
                          <SelectItem
                            key={preset.id}
                            value={preset.id}
                            className="font-geneva-12 text-[12px] select-none"
                          >
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop preset buttons */}
                  <div className="hidden md:flex gap-0 overflow-x-auto">
                    {presets.length > 0 ? (
                      presets.map((preset) => (
                        <Button
                          key={preset.id}
                          variant="player"
                          data-state={
                            currentPreset.id === preset.id ? "on" : "off"
                          }
                          onClick={() => loadPreset(preset)}
                          className="h-[22px] px-2 whitespace-nowrap uppercase select-none"
                        >
                          {preset.name}
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 font-geneva-12 select-none">
                        No presets yet. Create one with the NEW button.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-0">
                  <Button
                    variant="player"
                    onClick={() =>
                      setOctaveOffset((prev) => Math.max(-2, prev - 1))
                    }
                    className="h-[22px] px-2 select-none"
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="player"
                    onClick={() =>
                      setOctaveOffset((prev) => Math.min(2, prev + 1))
                    }
                    className="h-[22px] px-2 select-none"
                  >
                    &gt;
                  </Button>
                  <Button
                    variant="player"
                    onClick={() => setIsControlsVisible(!isControlsVisible)}
                    className="h-[22px] px-2 select-none"
                  >
                    CONTROLS
                  </Button>
                </div>
              </div>
            </div>

            {/* Controls panel */}
            <div className="relative w-full">
              <AnimatePresence>
                {isControlsVisible && (
                  <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.8,
                    }}
                    className="absolute top-0 inset-x-0 w-full bg-neutral-900/90 backdrop-blur-xl p-4 z-[40] select-none"
                  >
                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-start gap-6">
                      <div className="md:min-w-[200px] md:flex-grow md:flex-1 md:flex-basis-0">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-[#ff00ff] font-geneva-12 text-[10px] select-none">
                            Oscillator
                          </h3>
                          <Button
                            variant="player"
                            onClick={addPreset}
                            className="h-[22px] px-2 text-[9px] select-none"
                          >
                            ADD PRESET
                          </Button>
                        </div>
                        <Select
                          value={currentPreset.oscillator.type}
                          onValueChange={(value: OscillatorType) =>
                            handleOscillatorChange(value)
                          }
                        >
                          <SelectTrigger className="w-full bg-black border-[#3a3a3a] text-white font-geneva-12 text-[12px] p-2">
                            <SelectValue placeholder="Waveform" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-[#3a3a3a] text-white">
                            <SelectItem
                              value="sine"
                              className="font-geneva-12 text-[12px]"
                            >
                              Sine
                            </SelectItem>
                            <SelectItem
                              value="square"
                              className="font-geneva-12 text-[12px]"
                            >
                              Square
                            </SelectItem>
                            <SelectItem
                              value="triangle"
                              className="font-geneva-12 text-[12px]"
                            >
                              Triangle
                            </SelectItem>
                            <SelectItem
                              value="sawtooth"
                              className="font-geneva-12 text-[12px]"
                            >
                              Sawtooth
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <AnimatePresence>
                          {isControlsVisible && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="hidden md:block w-full"
                            >
                              <div className="w-full">
                                <Waveform3D analyzer={analyzerRef.current} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mobile: Horizontal scrollable container for Envelope + Effects */}
                      <div className="md:hidden overflow-x-auto">
                        <div className="flex flex-nowrap gap-6 min-w-max pb-2">
                          <div>
                            <h3 className="font-semibold mb-2 text-[#ff00ff] font-geneva-12 text-[10px] select-none">
                              Envelope
                            </h3>
                            <div className="flex flex-nowrap gap-1">
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.envelope.attack}
                                  min={0.01}
                                  max={2}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEnvelopeChange("attack", value)
                                  }
                                  label="Attack"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.envelope.decay}
                                  min={0.01}
                                  max={2}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEnvelopeChange("decay", value)
                                  }
                                  label="Decay"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.envelope.sustain}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEnvelopeChange("sustain", value)
                                  }
                                  label="Sustain"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.envelope.release}
                                  min={0.1}
                                  max={4}
                                  step={0.1}
                                  onChange={(value) =>
                                    handleEnvelopeChange("release", value)
                                  }
                                  label="Release"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2 text-[#ff00ff] font-geneva-12 text-[10px] select-none">
                              Effects
                            </h3>
                            <div className="flex flex-nowrap gap-1">
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.gain}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("gain", value)
                                  }
                                  label="Gain"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.reverb}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("reverb", value)
                                  }
                                  label="Reverb"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.delay}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("delay", value)
                                  }
                                  label="Delay"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.distortion}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("distortion", value)
                                  }
                                  label="Distortion"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.chorus ?? 0}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("chorus", value)
                                  }
                                  label="Chorus"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.phaser ?? 0}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("phaser", value)
                                  }
                                  label="Phaser"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                              <div className="w-16">
                                <Dial
                                  value={currentPreset.effects.bitcrusher ?? 0}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onChange={(value) =>
                                    handleEffectChange("bitcrusher", value)
                                  }
                                  label="Bitcrusher"
                                  color="#ff00ff"
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Original separate sections */}
                      <div className="hidden md:block md:flex-grow-0 md:flex-shrink-0 md:w-[140px]">
                        <h3 className="font-semibold mb-2 text-[#ff00ff] font-geneva-12 text-[10px] select-none">
                          Envelope
                        </h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-nowrap gap-2 py-0.5 overflow-x-auto">
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.envelope.attack}
                                min={0.01}
                                max={2}
                                step={0.01}
                                onChange={(value) =>
                                  handleEnvelopeChange("attack", value)
                                }
                                label="Attack"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.envelope.decay}
                                min={0.01}
                                max={2}
                                step={0.01}
                                onChange={(value) =>
                                  handleEnvelopeChange("decay", value)
                                }
                                label="Decay"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-nowrap gap-2 py-0.5 overflow-x-auto">
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.envelope.sustain}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEnvelopeChange("sustain", value)
                                }
                                label="Sustain"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.envelope.release}
                                min={0.1}
                                max={4}
                                step={0.1}
                                onChange={(value) =>
                                  handleEnvelopeChange("release", value)
                                }
                                label="Release"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block md:flex-shrink-0 md:w-[280px]">
                        <h3 className="font-semibold mb-2 text-[#ff00ff] font-geneva-12 text-[10px] select-none">
                          Effects
                        </h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-nowrap gap-2 py-0.5 overflow-x-auto">
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.gain}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("gain", value)
                                }
                                label="Gain"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.reverb}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("reverb", value)
                                }
                                label="Reverb"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.delay}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("delay", value)
                                }
                                label="Delay"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.distortion}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("distortion", value)
                                }
                                label="Distortion"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-nowrap gap-2 py-0.5 overflow-x-auto">
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.chorus ?? 0}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("chorus", value)
                                }
                                label="Chorus"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.phaser ?? 0}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("phaser", value)
                                }
                                label="Phaser"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                            <div className="w-16 flex-shrink-0">
                              <Dial
                                value={currentPreset.effects.bitcrusher ?? 0}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(value) =>
                                  handleEffectChange("bitcrusher", value)
                                }
                                label="Bitcrusher"
                                color="#ff00ff"
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Keyboard - fixed at bottom */}
            <div className="flex-grow flex flex-col justify-end min-h-[160px] bg-black p-4 w-full">
              <div
                className="relative h-full w-full"
                onTouchStart={(e) => {
                  e.preventDefault(); // Prevent scrolling while playing
                  // Handle all touches
                  Array.from(e.touches).forEach((touch) => {
                    const elementUnderTouch = document.elementFromPoint(
                      touch.clientX,
                      touch.clientY
                    ) as HTMLElement;

                    const keyElement =
                      elementUnderTouch?.closest("button[data-note]");
                    if (!keyElement) return;

                    const noteAttr = keyElement.getAttribute("data-note");
                    if (noteAttr) {
                      // Only add to activeTouches if note isn't already playing
                      if (!activeTouches[touch.identifier]) {
                        setActiveTouches((prev) => ({
                          ...prev,
                          [touch.identifier]: noteAttr,
                        }));
                        pressNote(noteAttr);
                      }
                    }
                  });
                }}
                onTouchMove={(e) => {
                  e.preventDefault(); // Prevent scrolling while playing
                  // Handle all touches
                  Array.from(e.touches).forEach((touch) => {
                    const elementUnderTouch = document.elementFromPoint(
                      touch.clientX,
                      touch.clientY
                    ) as HTMLElement;

                    const keyElement =
                      elementUnderTouch?.closest("button[data-note]");
                    const currentNote = activeTouches[touch.identifier];

                    if (keyElement) {
                      const noteAttr = keyElement.getAttribute("data-note");
                      if (noteAttr && noteAttr !== currentNote) {
                        // Release the previous note if it's different
                        if (currentNote) {
                          releaseNote(currentNote);
                        }
                        // Store and play the new note
                        setActiveTouches((prev) => ({
                          ...prev,
                          [touch.identifier]: noteAttr,
                        }));
                        pressNote(noteAttr);
                      }
                    } else {
                      // If we're not over a key, release the current note
                      if (currentNote) {
                        releaseNote(currentNote);
                        setActiveTouches((prev) => {
                          const newTouches = { ...prev };
                          delete newTouches[touch.identifier];
                          return newTouches;
                        });
                      }
                    }
                  });
                }}
                onTouchEnd={(e) => {
                  e.preventDefault(); // Prevent scrolling while playing
                  // Release notes for ended touches
                  const endedTouches = Array.from(e.changedTouches);
                  endedTouches.forEach((touch) => {
                    const note = activeTouches[touch.identifier];
                    if (note) {
                      releaseNote(note);
                      setActiveTouches((prev) => {
                        const newTouches = { ...prev };
                        delete newTouches[touch.identifier];
                        return newTouches;
                      });
                    }
                  });

                  // Safety check: ensure all touch identifiers in changedTouches are removed
                  if (e.touches.length === 0) {
                    // If no touches remain on the screen, release ALL active touches
                    Object.entries(activeTouches).forEach(([, note]) => {
                      releaseNote(note);
                    });
                    setActiveTouches({});
                  }
                }}
                onTouchCancel={(e) => {
                  e.preventDefault(); // Prevent scrolling while playing
                  // Release notes for cancelled touches
                  const cancelledTouches = Array.from(e.changedTouches);
                  cancelledTouches.forEach((touch) => {
                    const note = activeTouches[touch.identifier];
                    if (note) {
                      releaseNote(note);
                      setActiveTouches((prev) => {
                        const newTouches = { ...prev };
                        delete newTouches[touch.identifier];
                        return newTouches;
                      });
                    }
                  });

                  // Safety check: if this was the last touch, clear all active touches
                  if (e.touches.length === 0) {
                    Object.entries(activeTouches).forEach(([, note]) => {
                      releaseNote(note);
                    });
                    setActiveTouches({});
                  }
                }}
              >
                {/* White keys container */}
                <div className="absolute inset-0 h-full flex w-full">
                  {whiteKeys.map((note) => (
                    <div key={note} className="flex-1 relative">
                      <PianoKey
                        note={note}
                        isPressed={pressedNotes[note]}
                        onPress={pressNote}
                        onRelease={releaseNote}
                        labelType={labelType}
                        keyMap={keyToNoteMap}
                        octaveOffset={octaveOffset}
                      />
                    </div>
                  ))}
                </div>

                {/* Black keys container */}
                <div className="absolute inset-0 h-full w-full flex pointer-events-none">
                  {blackKeys.map((note, index) => {
                    // Only hide black keys at the end of the visible range
                    if (visibleKeyCount > 0 && index === blackKeys.length - 1) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="flex-1 relative"
                        />
                      );
                    }

                    return (
                      <div
                        key={note || `empty-${index}`}
                        className="flex-1 relative"
                      >
                        {note && (
                          <div className="pointer-events-auto w-full">
                            <PianoKey
                              note={note}
                              isBlack
                              isPressed={pressedNotes[note]}
                              onPress={pressNote}
                              onRelease={releaseNote}
                              labelType={labelType}
                              keyMap={keyToNoteMap}
                              octaveOffset={octaveOffset}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Status message */}
          <StatusDisplay message={statusMessage} />
        </div>
      </WindowFrame>

      {/* Dialogs */}
      <HelpDialog
        isOpen={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        helpItems={helpItems}
        appName="Synth"
      />

      <AboutDialog
        isOpen={isAboutOpen}
        onOpenChange={setIsAboutOpen}
        metadata={appMetadata}
      />

      <InputDialog
        isOpen={isPresetDialogOpen}
        onOpenChange={setIsPresetDialogOpen}
        onSubmit={savePreset}
        title={isSavingNewPreset ? "Save New Preset" : "Update Preset"}
        description={
          isSavingNewPreset
            ? "Enter a name for your preset"
            : "Update the name of your preset"
        }
        value={presetName}
        onChange={setPresetName}
      />
    </>
  );
}
