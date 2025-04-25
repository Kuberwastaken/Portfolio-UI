import { forwardRef, useEffect, useRef } from "react";
import { createWaveform } from "@/utils/audio";
import type WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  className?: string;
  audioData: string | null;
  onWaveformCreate?: (waveform: WaveSurfer) => void;
  isPlaying?: boolean;
}

export const Waveform = forwardRef<HTMLDivElement, WaveformProps>(
  ({ className = "", audioData, onWaveformCreate, isPlaying }, ref) => {
    const waveformRef = useRef<WaveSurfer>();
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!audioData || !containerRef.current) return;

      const initWaveform = async () => {
        if (waveformRef.current) {
          waveformRef.current.destroy();
        }

        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";
        const wavesurfer = await createWaveform(container, audioData);
        wavesurfer.setMuted(true);
        waveformRef.current = wavesurfer;
        onWaveformCreate?.(wavesurfer);
      };

      initWaveform();

      return () => {
        waveformRef.current?.destroy();
      };
    }, [audioData, onWaveformCreate]);

    useEffect(() => {
      if (!waveformRef.current) return;

      if (isPlaying) {
        waveformRef.current.play();
      } else {
        waveformRef.current.stop();
        waveformRef.current.seekTo(0);
      }
    }, [isPlaying]);

    return (
      <div
        ref={(node) => {
          if (node) {
            containerRef.current = node;
            if (ref) {
              if (typeof ref === "function") ref(node);
            }
          }
        }}
        className={`w-full h-12 flex-shrink-0 ${className}`}
      />
    );
  }
);

Waveform.displayName = "Waveform";
