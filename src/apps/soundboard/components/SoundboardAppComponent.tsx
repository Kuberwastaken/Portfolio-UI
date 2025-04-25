import React, { useState, useEffect, useRef } from "react";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { BoardList } from "./BoardList";
import { SoundGrid } from "./SoundGrid";
import { useSoundboard } from "@/hooks/useSoundboard";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { DialogState } from "@/types/types";
import {
  loadSelectedDeviceId,
  saveSelectedDeviceId,
  saveSoundboards,
} from "@/utils/storage";
import { EmojiDialog } from "@/components/dialogs/EmojiDialog";
import { InputDialog } from "@/components/dialogs/InputDialog";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { AppProps } from "../../base/types";
import { SoundboardMenuBar } from "./SoundboardMenuBar";
import { appMetadata } from "..";

interface ImportedSlot {
  audioData: string | null;
  emoji?: string;
  title?: string;
}

interface ImportedBoard {
  id?: string;
  name: string;
  slots: ImportedSlot[];
}

export function SoundboardAppComponent({
  onClose,
  isWindowOpen,
  isForeground,
  helpItems = [],
}: AppProps) {
  const {
    boards,
    activeBoard,
    activeBoardId,
    playbackStates,
    waveformRefs,
    setActiveBoardId,
    addNewBoard,
    updateBoardName,
    updateSlot,
    deleteSlot,
    playSound,
    stopSound,
    setBoards,
    setPlaybackStates,
  } = useSoundboard();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    isOpen: false,
    slotIndex: -1,
    value: "",
  });

  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] =
    useState(loadSelectedDeviceId);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [showEmojis, setShowEmojis] = useState(true);
  const activeSlotRef = useRef<number | null>(null);

  const handleRecordingComplete = (base64Data: string) => {
    const activeSlot = activeSlotRef.current;
    if (activeSlot !== null) {
      updateSlot(activeSlot, { audioData: base64Data });
    }
  };

  const {
    micPermissionGranted,
    startRecording: startRec,
    stopRecording,
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    selectedDeviceId,
    setRecordingState: (isRecording) => {
      const activeSlot = activeSlotRef.current;
      if (activeSlot !== null) {
        setPlaybackStates((prev) => {
          const newStates = [...prev];
          newStates[activeSlot] = {
            ...newStates[activeSlot],
            isRecording,
          };
          return newStates;
        });
      }
    },
  });

  useEffect(() => {
    if (micPermissionGranted) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAudioDevices(audioInputs);

        const defaultDevice = audioInputs.find(
          (d) => d.deviceId === "default" || d.deviceId === selectedDeviceId
        );
        if (defaultDevice) {
          setSelectedDeviceId(defaultDevice.deviceId);
        }
      });
    }
  }, [micPermissionGranted, selectedDeviceId]);

  useEffect(() => {
    saveSelectedDeviceId(selectedDeviceId);
  }, [selectedDeviceId]);

  // Stop playing sounds and reset playback state when switching boards
  useEffect(() => {
    // Stop any currently playing sounds
    playbackStates.forEach((state, index) => {
      if (state.isPlaying) {
        stopSound(index);
      }
    });

    // Reset playback states for the new board
    setPlaybackStates(Array(9).fill({ isRecording: false, isPlaying: false }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoardId]); // Dependency: Run only when activeBoardId changes

  const startRecording = (index: number) => {
    activeSlotRef.current = index;
    startRec();
  };

  const handleSlotClick = (index: number) => {
    const slot = activeBoard.slots[index];

    if (playbackStates[index].isRecording) {
      stopRecording();
    } else if (slot.audioData) {
      if (playbackStates[index].isPlaying) {
        stopSound(index);
      } else {
        playSound(index);
      }
    } else {
      startRecording(index);
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogState.type) return;
    updateSlot(dialogState.slotIndex, {
      [dialogState.type]: dialogState.value,
    });
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleImportBoard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const importedBoards = importedData.boards || [importedData];
        const newBoards = importedBoards.map((board: ImportedBoard) => ({
          ...board,
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          slots: board.slots.map((slot: ImportedSlot) => ({
            audioData: slot.audioData,
            emoji: slot.emoji,
            title: slot.title,
          })),
        }));
        setBoards([...boards, ...newBoards]);
        setActiveBoardId(newBoards[0].id);
        saveSoundboards(newBoards);
      } catch (err) {
        console.error("Failed to import soundboards:", err);
      }
    };
    reader.readAsText(file);
  };

  const exportBoard = () => {
    const exportData = {
      boards: boards.map((board) => ({
        ...board,
        slots: board.slots.map((slot) => ({
          audioData: slot.audioData,
          emoji: slot.emoji,
          title: slot.title,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soundboards.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reloadFromJson = async () => {
    try {
      const res = await fetch("/soundboards.json");
      const data = await res.json();
      const importedBoards = data.boards || [data];
      const newBoards = importedBoards.map((board: ImportedBoard) => ({
        ...board,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        slots: board.slots.map((slot: ImportedSlot) => ({
          audioData: slot.audioData,
          emoji: slot.emoji,
          title: slot.title,
        })),
      }));
      setBoards(newBoards);
      setActiveBoardId(newBoards[0].id);
      saveSoundboards(newBoards);
    } catch (err) {
      console.error("Failed to reload soundboards.json:", err);
    }
  };

  const reloadFromAllSounds = async () => {
    try {
      const res = await fetch("/all-sounds.json");
      const data = await res.json();
      const importedBoards = data.boards || [data];
      const newBoards = importedBoards.map((board: ImportedBoard) => ({
        ...board,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        slots: board.slots.map((slot: ImportedSlot) => ({
          audioData: slot.audioData,
          emoji: slot.emoji,
          title: slot.title,
        })),
      }));
      setBoards(newBoards);
      setActiveBoardId(newBoards[0].id);
      saveSoundboards(newBoards);
    } catch (err) {
      console.error("Failed to reload all-sounds.json:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const index = e.keyCode >= 97 ? e.keyCode - 97 : e.keyCode - 49;
      if (
        (e.keyCode >= 97 && e.keyCode <= 105) ||
        (e.keyCode >= 49 && e.keyCode <= 57)
      ) {
        const slot = activeBoard.slots[index];
        if (slot.audioData) {
          if (playbackStates[index].isPlaying) {
            stopSound(index);
          } else {
            playSound(index);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeBoard.slots, playbackStates, playSound, stopSound]);

  return (
    <>
      <SoundboardMenuBar
        onClose={onClose}
        isWindowOpen={isWindowOpen}
        onNewBoard={addNewBoard}
        onImportBoard={() => importInputRef.current?.click()}
        onExportBoard={exportBoard}
        onReloadBoard={reloadFromJson}
        onReloadAllSounds={reloadFromAllSounds}
        onRenameBoard={() => setIsEditingTitle(true)}
        onDeleteBoard={() => {
          const newBoards = boards.filter((b) => b.id !== activeBoardId);
          if (newBoards.length > 0) {
            setBoards(newBoards);
            setActiveBoardId(newBoards[0].id);
            saveSoundboards(newBoards);
          }
        }}
        canDeleteBoard={boards.length > 1}
        onShowHelp={() => setHelpDialogOpen(true)}
        onShowAbout={() => setAboutDialogOpen(true)}
        showWaveforms={showWaveforms}
        onToggleWaveforms={setShowWaveforms}
        showEmojis={showEmojis}
        onToggleEmojis={setShowEmojis}
      />
      <WindowFrame
        title="Soundboard"
        onClose={onClose}
        isForeground={isForeground}
        appId="soundboard"
        windowConstraints={{
          minHeight: window.innerWidth >= 768 ? 475 : 625,
        }}
      >
        <input
          type="file"
          ref={importInputRef}
          className="hidden"
          accept="application/json"
          onChange={handleImportBoard}
        />

        <BoardList
          boards={boards}
          activeBoardId={activeBoardId}
          onBoardSelect={setActiveBoardId}
          onNewBoard={addNewBoard}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={setSelectedDeviceId}
          audioDevices={audioDevices}
          micPermissionGranted={micPermissionGranted}
        />

        <SoundGrid
          board={activeBoard}
          playbackStates={playbackStates}
          waveformRefs={waveformRefs.current}
          isEditingTitle={isEditingTitle}
          onTitleChange={(name) => updateBoardName(name)}
          onTitleBlur={(name) => {
            updateBoardName(name);
            setIsEditingTitle(false);
          }}
          onTitleKeyDown={(e) => {
            if (e.key === "Enter") {
              updateBoardName(e.currentTarget.value);
              setIsEditingTitle(false);
            }
          }}
          onSlotClick={handleSlotClick}
          onSlotDelete={deleteSlot}
          onSlotEmojiClick={(index) =>
            setDialogState({
              type: "emoji",
              isOpen: true,
              slotIndex: index,
              value: activeBoard.slots[index].emoji || "",
            })
          }
          onSlotTitleClick={(index) =>
            setDialogState({
              type: "title",
              isOpen: true,
              slotIndex: index,
              value: activeBoard.slots[index].title || "",
            })
          }
          setIsEditingTitle={setIsEditingTitle}
          showWaveforms={showWaveforms}
          showEmojis={showEmojis}
        />

        <EmojiDialog
          isOpen={dialogState.isOpen && dialogState.type === "emoji"}
          onOpenChange={(open) =>
            setDialogState((prev) => ({ ...prev, isOpen: open }))
          }
          onEmojiSelect={(emoji) => {
            updateSlot(dialogState.slotIndex, { emoji });
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          }}
        />

        <InputDialog
          isOpen={dialogState.isOpen && dialogState.type === "title"}
          onOpenChange={(open) =>
            setDialogState((prev) => ({ ...prev, isOpen: open }))
          }
          onSubmit={handleDialogSubmit}
          title="Set Title"
          description="Enter a title for this sound slot"
          value={dialogState.value}
          onChange={(value) => setDialogState((prev) => ({ ...prev, value }))}
        />

        <HelpDialog
          isOpen={helpDialogOpen}
          onOpenChange={setHelpDialogOpen}
          helpItems={helpItems}
          appName="Soundboard"
        />
        <AboutDialog
          isOpen={aboutDialogOpen}
          onOpenChange={setAboutDialogOpen}
          metadata={appMetadata}
        />
      </WindowFrame>
    </>
  );
}
