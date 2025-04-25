import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioInputButton } from "@/components/ui/audio-input-button";
import { useChatSynth } from "@/hooks/useChatSynth";
import { loadTypingSynthEnabled } from "@/utils/storage";
import { useSound, Sounds } from "@/hooks/useSound";
import { track } from "@vercel/analytics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Analytics event namespace for chat events
export const CHAT_ANALYTICS = {
  TEXT_MESSAGE: "chats:text",
  VOICE_MESSAGE: "chats:voice",
  NUDGE: "chats:nudge",
  STOP_GENERATION: "chats:stop",
};

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isForeground?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
  onDirectMessageSubmit?: (message: string) => void;
  onNudge?: () => void;
  previousMessages?: string[];
}

export function ChatInput({
  input,
  isLoading,
  isForeground = false,
  onInputChange,
  onSubmit,
  onStop,
  onDirectMessageSubmit,
  onNudge,
  previousMessages = [],
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const { playNote } = useChatSynth();
  const { play: playNudgeSound } = useSound(Sounds.MSN_NUDGE);

  useEffect(() => {
    // Check if device has touch capability
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && previousMessages.length > 0) {
        e.preventDefault();
        const nextIndex = historyIndex + 1;
        if (nextIndex < previousMessages.length) {
          setHistoryIndex(nextIndex);
          const event = {
            target: { value: previousMessages[nextIndex] },
          } as React.ChangeEvent<HTMLInputElement>;
          onInputChange(event);
        }
      } else if (e.key === "ArrowDown" && historyIndex > -1) {
        e.preventDefault();
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        const event = {
          target: {
            value: nextIndex === -1 ? "" : previousMessages[nextIndex],
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, previousMessages, onInputChange]);

  // Reset history index when input changes manually
  useEffect(() => {
    setHistoryIndex(-1);
  }, [input]);

  const handleInputChangeWithSound = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onInputChange(e);
    setHistoryIndex(-1); // Reset history index when typing

    // Only play sound if typing synth is enabled and enough time has passed
    const now = Date.now();
    if (loadTypingSynthEnabled() && now - lastTypingTime > 50) {
      playNote();
      setLastTypingTime(now);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    setIsTranscribing(false);
    setIsRecording(false);
    setTranscriptionError(null);

    if (!text) {
      setTranscriptionError("No transcription text received");
      return;
    }

    // Track voice message
    track(CHAT_ANALYTICS.VOICE_MESSAGE);

    // Submit the transcribed text directly if the function is available
    if (onDirectMessageSubmit) {
      onDirectMessageSubmit(text.trim());
    } else {
      // Fallback to form submission
      const transcriptionEvent = {
        target: { value: text.trim() },
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(transcriptionEvent);

      const submitEvent = new Event(
        "submit"
      ) as unknown as React.FormEvent<HTMLFormElement>;
      onSubmit(submitEvent);

      const clearEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(clearEvent);
    }
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
  };

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  const handleNudgeClick = () => {
    track(CHAT_ANALYTICS.NUDGE);
    playNudgeSound();
    onNudge?.();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        isForeground &&
        !isFocused &&
        !isTranscribing
      ) {
        e.preventDefault();
        audioButtonRef.current?.click();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isForeground && !isFocused && isTranscribing) {
        e.preventDefault();
        audioButtonRef.current?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isForeground, isFocused, isTranscribing]);

  return (
    <form
      onSubmit={(e) => {
        if (input.trim() !== "") {
          track(CHAT_ANALYTICS.TEXT_MESSAGE, {
            message: input,
          });
        }
        onSubmit(e);
      }}
      className="flex gap-1"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          layout
          className="flex-1 relative"
          transition={{ duration: 0.15 }}
        >
          <Input
            value={input}
            onChange={handleInputChangeWithSound}
            placeholder={
              isRecording
                ? "Recording..."
                : isTranscribing
                ? "Transcribing..."
                : isFocused || isTouchDevice
                ? "Type a message..."
                : "Type or push 'space' to talk..."
            }
            className={`w-full border-1 border-gray-800 text-xs font-geneva-12 h-8 pr-16 ${
              isFocused ? "input--focused" : ""
            }`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onTouchStart={(e) => {
              e.preventDefault();
            }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleNudgeClick}
                      className="w-[22px] h-[22px] flex items-center justify-center"
                      disabled={isLoading}
                    >
                      <Hand className="h-4 w-4 -rotate-40" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send a nudge</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <AudioInputButton
                      ref={audioButtonRef}
                      onTranscriptionComplete={handleTranscriptionComplete}
                      onTranscriptionStart={handleTranscriptionStart}
                      onRecordingStateChange={handleRecordingStateChange}
                      isLoading={isTranscribing}
                      silenceThreshold={1200}
                      className="w-[22px] h-[22px] flex items-center justify-center"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Push to talk</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {transcriptionError && (
              <div className="absolute top-full mt-1 right-0 bg-red-100 text-red-600 text-xs p-1 rounded shadow-sm">
                {transcriptionError}
              </div>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div
            key="stop"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            layout
          >
            <Button
              type="button"
              onClick={() => {
                track(CHAT_ANALYTICS.STOP_GENERATION);
                onStop();
              }}
              className="bg-black hover:bg-black/80 text-white text-xs border-2 border-gray-800 w-8 h-8 p-0 flex items-center justify-center"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </Button>
          </motion.div>
        ) : input.trim() !== "" ? (
          <motion.div
            key="send"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            layout
          >
            <Button
              type="submit"
              className="bg-black hover:bg-black/80 text-white text-xs border-2 border-gray-800 w-8 h-8 p-0 flex items-center justify-center"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
