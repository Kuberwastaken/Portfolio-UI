import React, { useState, useRef, useEffect, useCallback } from "react";
import { PaintToolbar } from "./PaintToolbar";
import { PaintCanvas } from "./PaintCanvas";
import { PaintMenuBar } from "./PaintMenuBar";
import { PaintPatternPalette } from "./PaintPatternPalette";
import { PaintStrokeSettings } from "./PaintStrokeSettings";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { AppProps } from "../../base/types";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { InputDialog } from "@/components/dialogs/InputDialog";
import { helpItems, appMetadata } from "..";
import { useFileSystem } from "@/apps/finder/hooks/useFileSystem";
import { useLaunchApp } from "@/hooks/useLaunchApp";
import { APP_STORAGE_KEYS } from "@/utils/storage";
import { Filter } from "./PaintFiltersMenu";

export const PaintAppComponent: React.FC<AppProps> = ({
  isWindowOpen,
  onClose,
  isForeground = false,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>("pencil");
  const [selectedPattern, setSelectedPattern] = useState<string>("pattern-1");
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isConfirmNewDialogOpen, setIsConfirmNewDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(589);
  const [canvasHeight, setCanvasHeight] = useState(418);
  const canvasRef = useRef<{
    undo: () => void;
    redo: () => void;
    clear: () => void;
    exportCanvas: () => Promise<Blob>;
    importImage: (dataUrl: string) => void;
    cut: () => void;
    copy: () => void;
    paste: () => void;
    applyFilter: (filter: Filter) => void;
  }>();
  const { files, saveFile } = useFileSystem("/Images");
  const launchApp = useLaunchApp();
  const contentChangeTimeoutRef = useRef<number | null>(null);

  // Initial load - try to restore last opened image
  useEffect(() => {
    if (canvasRef.current) {
      const lastFilePath = localStorage.getItem(
        APP_STORAGE_KEYS.paint.LAST_FILE_PATH
      );

      if (lastFilePath?.startsWith("/Images/")) {
        const file = files.find((f) => f.path === lastFilePath);
        if (file) {
          // Use contentUrl if available, otherwise use content
          const contentSource = file.contentUrl || file.content;

          if (!contentSource) {
            console.error("No content found for file:", file.name);
            return;
          }

          const img = new Image();

          // Add error handling
          img.onerror = (error) => {
            console.error("Error loading image:", error);

            // If contentUrl failed but we have a Blob content, try creating a new URL
            if (file.contentUrl && file.content instanceof Blob) {
              console.log("Trying to recreate Blob URL for", file.name);
              const newUrl = URL.createObjectURL(file.content);

              // Update file with new URL and try again
              file.contentUrl = newUrl;

              const newImg = new Image();
              newImg.onload = () => handleFileOpen(lastFilePath, newUrl);
              newImg.onerror = () =>
                console.error("Failed to load image even with new Blob URL");
              newImg.src = newUrl;
            }
          };

          img.onload = () => {
            // Calculate dimensions maintaining aspect ratio with max width of 589px
            let newWidth = img.width;
            let newHeight = img.height;
            if (newWidth > 589) {
              const ratio = 589 / newWidth;
              newWidth = 589;
              newHeight = Math.round(img.height * ratio);
            }
            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
            setIsLoadingFile(true);
            canvasRef.current?.importImage(contentSource as string);
            setCurrentFilePath(lastFilePath);
            setHasUnsavedChanges(false);
            setIsLoadingFile(false);
          };

          img.src = contentSource as string;
        }
      }
    }
  }, [files, currentFilePath]);

  // Check for pending file open when window becomes active
  useEffect(() => {
    if (isForeground && canvasRef.current) {
      const pendingFileOpen = localStorage.getItem("pending_file_open");
      if (pendingFileOpen) {
        try {
          const { path, content } = JSON.parse(pendingFileOpen);
          if (path.startsWith("/Images/")) {
            if (hasUnsavedChanges && currentFilePath) {
              setIsConfirmNewDialogOpen(true);
            } else {
              handleFileOpen(path, content);
            }
          }
        } catch (e) {
          console.error("Failed to parse pending file open data:", e);
          localStorage.removeItem("pending_file_open");
        }
      }
    }
  }, [isForeground, hasUnsavedChanges, currentFilePath, files]);

  // Auto-save effect
  useEffect(() => {
    if (!canvasRef.current) return;

    if (hasUnsavedChanges && currentFilePath && !isLoadingFile) {
      const timeoutId = window.setTimeout(async () => {
        if (!canvasRef.current) return;

        try {
          const blob = await canvasRef.current.exportCanvas();
          const blobUrl = URL.createObjectURL(blob);
          const fileName = currentFilePath.split("/").pop() || "untitled.png";

          // Save using useFileSystem hook
          saveFile({
            name: fileName,
            path: currentFilePath,
            content: blob,
            contentUrl: blobUrl,
            icon: "/icons/image.png",
            isDirectory: false,
            size: blob.size,
          });

          // Also emit the saveFile event for Finder to refresh
          const saveEvent = new CustomEvent("saveFile", {
            detail: {
              name: fileName,
              path: currentFilePath,
              content: blob,
              contentUrl: blobUrl,
              icon: "/icons/image.png",
              isDirectory: false,
              size: blob.size,
            },
          });
          window.dispatchEvent(saveEvent);

          localStorage.setItem(
            APP_STORAGE_KEYS.paint.LAST_FILE_PATH,
            currentFilePath
          );
          setHasUnsavedChanges(false);
        } catch (err) {
          console.error("Error auto-saving file:", err);
        }
      }, 2000); // Auto-save after 2 seconds of no changes

      return () => window.clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, currentFilePath, isLoadingFile]);

  const handleFileOpen = (path: string, content: string) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio with max width of 589px
      let newWidth = img.width;
      let newHeight = img.height;
      if (newWidth > 589) {
        const ratio = 589 / newWidth;
        newWidth = 589;
        newHeight = Math.round(img.height * ratio);
      }
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setIsLoadingFile(true);
      canvasRef.current?.importImage(content);
      setCurrentFilePath(path);
      setHasUnsavedChanges(false);
      localStorage.setItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH, path);
      setIsLoadingFile(false);
      localStorage.removeItem("pending_file_open");
    };

    img.onerror = (error) => {
      console.error("Error loading image for import:", error);

      // Try to find the file and recreate a Blob URL if needed
      const file = files.find((f) => f.path === path);
      if (file?.content instanceof Blob) {
        const newUrl = URL.createObjectURL(file.content);

        // Try again with the new URL
        const newImg = new Image();
        newImg.onload = () => {
          // Calculate dimensions maintaining aspect ratio with max width of 589px
          let newWidth = newImg.width;
          let newHeight = newImg.height;
          if (newWidth > 589) {
            const ratio = 589 / newWidth;
            newWidth = 589;
            newHeight = Math.round(newImg.height * ratio);
          }

          setCanvasWidth(newWidth);
          setCanvasHeight(newHeight);
          setIsLoadingFile(true);
          canvasRef.current?.importImage(newUrl);
          setCurrentFilePath(path);
          setHasUnsavedChanges(false);
          localStorage.setItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH, path);
          setIsLoadingFile(false);
          localStorage.removeItem("pending_file_open");
        };
        newImg.onerror = () =>
          console.error("Failed to load image even with new URL");
        newImg.src = newUrl;
      }
    };

    img.src = content;
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    localStorage.removeItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH);
    setHasUnsavedChanges(false);
    setCanvasWidth(589);
    setCanvasHeight(418);
  };

  const handleNewFile = () => {
    if (hasUnsavedChanges) {
      setIsConfirmNewDialogOpen(true);
      return;
    }
    handleClear();
    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    if (!currentFilePath) {
      setIsSaveDialogOpen(true);
      setSaveFileName("untitled.png");
    } else {
      try {
        const blob = await canvasRef.current.exportCanvas();
        const blobUrl = URL.createObjectURL(blob);
        const fileName = currentFilePath.split("/").pop() || "untitled.png";

        // Save using useFileSystem hook
        saveFile({
          name: fileName,
          path: currentFilePath,
          content: blob,
          contentUrl: blobUrl,
          icon: "/icons/image.png",
          isDirectory: false,
          size: blob.size,
        });

        // Also emit the saveFile event for Finder to refresh
        const saveEvent = new CustomEvent("saveFile", {
          detail: {
            name: fileName,
            path: currentFilePath,
            content: blob,
            contentUrl: blobUrl,
            icon: "/icons/image.png",
            isDirectory: false,
            size: blob.size,
          },
        });
        window.dispatchEvent(saveEvent);

        localStorage.setItem(
          APP_STORAGE_KEYS.paint.LAST_FILE_PATH,
          currentFilePath
        );
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Error saving file:", err);
      }
    }
  };

  const handleSaveSubmit = async (fileName: string) => {
    if (!canvasRef.current) return;

    try {
      const blob = await canvasRef.current.exportCanvas();
      const blobUrl = URL.createObjectURL(blob);
      const filePath = `/Images/${fileName}${
        fileName.endsWith(".png") ? "" : ".png"
      }`;

      // Save using useFileSystem hook
      saveFile({
        name: fileName,
        path: filePath,
        content: blob,
        contentUrl: blobUrl,
        icon: "/icons/image.png",
        isDirectory: false,
        size: blob.size,
      });

      // Also emit the saveFile event for Finder to refresh
      const saveEvent = new CustomEvent("saveFile", {
        detail: {
          name: fileName,
          path: filePath,
          content: blob,
          contentUrl: blobUrl,
          icon: "/icons/image.png",
          isDirectory: false,
          size: blob.size,
        },
      });
      window.dispatchEvent(saveEvent);

      localStorage.setItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH, filePath);
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);
      setIsSaveDialogOpen(false);
    } catch (err) {
      console.error("Error saving file:", err);
    }
  };

  const handleImportFile = () => {
    launchApp("finder", { initialPath: "/Images" });
  };

  const handleExportFile = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await canvasRef.current.exportCanvas();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = currentFilePath?.split("/").pop() || "untitled.png";

      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the URL to free up memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error("Error exporting file:", err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio with max width of 589px
          let newWidth = img.width;
          let newHeight = img.height;
          if (newWidth > 589) {
            const ratio = 589 / newWidth;
            newWidth = 589;
            newHeight = Math.round(img.height * ratio);
          }
          setCanvasWidth(newWidth);
          setCanvasHeight(newHeight);
          setIsLoadingFile(true);
          canvasRef.current?.importImage(dataUrl);
          setIsLoadingFile(false);
          // Set suggested file name but open save dialog
          setSaveFileName(file.name);
          setIsSaveDialogOpen(true);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCut = () => {
    canvasRef.current?.cut();
  };

  const handleCopy = () => {
    canvasRef.current?.copy();
  };

  const handlePaste = () => {
    canvasRef.current?.paste();
  };

  // Debounced content change handler
  const handleContentChange = useCallback(() => {
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current);
    }

    contentChangeTimeoutRef.current = window.setTimeout(() => {
      if (!isLoadingFile) {
        setHasUnsavedChanges(true);
      }
      contentChangeTimeoutRef.current = null;
    }, 300) as unknown as number;
  }, [isLoadingFile]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (contentChangeTimeoutRef.current) {
        window.clearTimeout(contentChangeTimeoutRef.current);
      }
    };
  }, []);

  // Add useEffect for cleaning up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any pending blob URLs
      const pendingFileOpen = localStorage.getItem("pending_file_open");
      if (pendingFileOpen) {
        try {
          const { content } = JSON.parse(pendingFileOpen);
          if (content && content.startsWith("blob:")) {
            URL.revokeObjectURL(content);
          }
        } catch (e) {
          console.error("Failed to cleanup pending file blob URL:", e);
        }
      }
    };
  }, []);

  if (!isWindowOpen) return null;

  return (
    <>
      <PaintMenuBar
        isWindowOpen={isWindowOpen}
        isForeground={isForeground}
        onClose={onClose}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onShowHelp={() => setIsHelpDialogOpen(true)}
        onShowAbout={() => setIsAboutDialogOpen(true)}
        onNewFile={handleNewFile}
        onSave={handleSave}
        onImportFile={handleImportFile}
        onExportFile={handleExportFile}
        hasUnsavedChanges={hasUnsavedChanges}
        currentFilePath={currentFilePath}
        handleFileSelect={handleFileSelect}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onApplyFilter={(filter) => {
          canvasRef.current?.applyFilter(filter);
        }}
      />
      <WindowFrame
        title={
          currentFilePath
            ? currentFilePath.split("/").pop() || "Untitled"
            : `Untitled${hasUnsavedChanges ? " •" : ""}`
        }
        onClose={onClose}
        isForeground={isForeground}
        appId="paint"
      >
        <div
          className="flex flex-col h-full w-full min-h-0 p-2"
          style={{
            backgroundImage: 'url("/patterns/Property 1=7.svg")',
            backgroundRepeat: "repeat",
            backgroundColor: "#c0c0c0",
          }}
        >
          <div className="flex flex-1 gap-2 w-full min-h-0 px-1">
            {/* Left Toolbar */}
            <div className="flex flex-col gap-2 w-[84px] shrink-0">
              {/* Tools */}
              <div className="bg-white border border-black w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                <PaintToolbar
                  selectedTool={selectedTool}
                  onToolSelect={setSelectedTool}
                />
              </div>
              {/* Stroke Width */}
              <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                <PaintStrokeSettings
                  strokeWidth={strokeWidth}
                  onStrokeWidthChange={setStrokeWidth}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 gap-2 min-h-0 min-w-0">
              {/* Canvas */}
              <div className="flex-1 bg-white min-h-0 min-w-0 border border-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] overflow-auto">
                <PaintCanvas
                  ref={(ref) => {
                    if (ref) {
                      canvasRef.current = {
                        undo: ref.undo,
                        redo: ref.redo,
                        clear: ref.clear,
                        exportCanvas: ref.exportCanvas,
                        importImage: ref.importImage,
                        cut: ref.cut,
                        copy: ref.copy,
                        paste: ref.paste,
                        applyFilter: ref.applyFilter,
                      };
                    }
                  }}
                  selectedTool={selectedTool}
                  selectedPattern={selectedPattern}
                  strokeWidth={strokeWidth}
                  onCanUndoChange={setCanUndo}
                  onCanRedoChange={setCanRedo}
                  onContentChange={handleContentChange}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              </div>

              {/* Pattern Area */}
              <div className="h-[58px] bg-white border-black flex items-center border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                {/* Selected Pattern Preview */}
                <div className="border-r border-black h-full px-3 flex items-center">
                  <div className="w-[36px] h-[32px] border border-black shrink-0">
                    <img
                      src={`/patterns/Property 1=${
                        selectedPattern.split("-")[1]
                      }.svg`}
                      alt="Selected Pattern"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Pattern Palette */}
                <div className="flex-1 h-full min-w-0 translate-y-[-1px]">
                  <PaintPatternPalette
                    selectedPattern={selectedPattern}
                    onPatternSelect={setSelectedPattern}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
      <InputDialog
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSubmit={handleSaveSubmit}
        title="Save Image"
        description="Enter a name for your image"
        value={saveFileName}
        onChange={setSaveFileName}
      />
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        helpItems={helpItems}
        appName="MacPaint"
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
      />
      <ConfirmDialog
        isOpen={isConfirmNewDialogOpen}
        onOpenChange={setIsConfirmNewDialogOpen}
        onConfirm={() => {
          handleClear();
          setCurrentFilePath(null);
          setHasUnsavedChanges(false);
          setIsConfirmNewDialogOpen(false);
          localStorage.removeItem(APP_STORAGE_KEYS.paint.LAST_FILE_PATH);

          // Check if there's a pending file to open after creating new file
          const pendingFileOpen = localStorage.getItem("pending_file_open");
          if (pendingFileOpen) {
            try {
              const { path, content } = JSON.parse(pendingFileOpen);
              if (path.startsWith("/Images/")) {
                handleFileOpen(path, content);
              }
            } catch (e) {
              console.error("Failed to parse pending file open data:", e);
              localStorage.removeItem("pending_file_open");
            }
          }
        }}
        title="Discard Changes"
        description="You have unsaved changes. Create new file anyway?"
      />
    </>
  );
};
