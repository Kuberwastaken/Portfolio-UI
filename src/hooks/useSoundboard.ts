import { useState, useEffect, useRef, useCallback } from "react";
import { Soundboard, SoundSlot, PlaybackState } from "../types/types";
import {
  loadSoundboards,
  saveSoundboards,
  createDefaultBoard,
} from "../utils/storage";
import { createAudioFromBase64 } from "../utils/audio";
import type WaveSurfer from "wavesurfer.js";

export const useSoundboard = () => {
  const [boards, setBoards] = useState<Soundboard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>("");
  const [playbackStates, setPlaybackStates] = useState<PlaybackState[]>(
    Array(9).fill({ isRecording: false, isPlaying: false })
  );
  const audioRefs = useRef<(HTMLAudioElement | null)[]>(Array(9).fill(null));
  const waveformRefs = useRef<((el: HTMLDivElement | null) => void)[]>(
    Array(9).fill(null)
  );

  useEffect(() => {
    loadSoundboards().then((loadedBoards) => {
      setBoards(loadedBoards);
      setActiveBoardId(loadedBoards[0]?.id || "default");
    });
  }, []);

  const activeBoard =
    boards.find((b) => b.id === activeBoardId) || createDefaultBoard();

  const addNewBoard = useCallback(() => {
    const newBoard = createDefaultBoard();
    newBoard.id = Date.now().toString();
    const newBoards = [...boards, newBoard];
    saveSoundboards(newBoards);
    setBoards(newBoards);
    setActiveBoardId(newBoard.id);
  }, [boards]);

  const updateBoardName = useCallback(
    (name: string) => {
      const newBoards = boards.map((board) =>
        board.id === activeBoardId ? { ...board, name } : board
      );
      saveSoundboards(newBoards);
      setBoards(newBoards);
    },
    [boards, activeBoardId]
  );

  const deleteCurrentBoard = useCallback(() => {
    if (boards.length <= 1) return;
    const newBoards = boards.filter((b) => b.id !== activeBoardId);
    saveSoundboards(newBoards);
    setBoards(newBoards);
    setActiveBoardId(newBoards[0].id);
  }, [boards, activeBoardId]);

  const updateSlot = useCallback(
    (index: number, updates: Partial<SoundSlot>) => {
      const newBoards = boards.map((board) => {
        if (board.id === activeBoardId) {
          const newSlots = [...board.slots];
          newSlots[index] = { ...newSlots[index], ...updates };
          return { ...board, slots: newSlots };
        }
        return board;
      });
      saveSoundboards(newBoards);
      setBoards(newBoards);
    },
    [boards, activeBoardId]
  );

  const deleteSlot = useCallback(
    (index: number) => {
      updateSlot(index, {
        audioData: null,
        emoji: undefined,
        title: undefined,
      });
    },
    [updateSlot]
  );

  const updateSlotState = useCallback((index: number, isPlaying: boolean) => {
    setPlaybackStates((prev) => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], isPlaying };
      return newStates;
    });
  }, []);

  const playSound = useCallback(
    (index: number) => {
      const slot = activeBoard.slots[index];
      if (!slot.audioData) return;

      const audio = createAudioFromBase64(slot.audioData);
      audioRefs.current[index] = audio;
      updateSlotState(index, true);

      audio.play();

      audio.onended = () => {
        updateSlotState(index, false);
        audioRefs.current[index] = null;
      };
    },
    [activeBoard, updateSlotState]
  );

  const stopSound = useCallback(
    (index: number) => {
      const audio = audioRefs.current[index];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audioRefs.current[index] = null;
        updateSlotState(index, false);
      }
    },
    [updateSlotState]
  );

  const handleWaveformCreate = useCallback(
    (index: number, waveform: WaveSurfer) => {
      const slot = activeBoard.slots[index];
      if (!slot.audioData) return;

      updateSlot(index, { waveform });
    },
    [activeBoard, updateSlot]
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
    playbackStates,
    waveformRefs,
    setActiveBoardId,
    addNewBoard,
    updateBoardName,
    deleteCurrentBoard,
    updateSlot,
    deleteSlot,
    playSound,
    stopSound,
    handleWaveformCreate,
    setBoards,
    setPlaybackStates,
  };
};
