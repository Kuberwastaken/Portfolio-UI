import { WindowFrame } from "@/components/layout/WindowFrame";
import { FinderMenuBar, ViewType, SortType } from "./FinderMenuBar";
import { AppProps } from "@/apps/base/types";
import { useState, useRef, useEffect } from "react";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { FileList } from "./FileList";
import { useFileSystem } from "../hooks/useFileSystem";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { appMetadata, helpItems } from "../index";
import { calculateStorageSpace } from "@/utils/storage";
import { InputDialog } from "@/components/dialogs/InputDialog";

export function FinderAppComponent({
  onClose,
  isWindowOpen,
  isForeground = true,
}: AppProps) {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(
    (localStorage.getItem("finder_view_type") as ViewType) || "list"
  );
  const [sortType, setSortType] = useState<SortType>(
    (localStorage.getItem("finder_sort_type") as SortType) || "name"
  );
  const pathInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageSpace, setStorageSpace] = useState(calculateStorageSpace());

  const {
    currentPath,
    files,
    selectedFile,
    isLoading,
    error,
    handleFileOpen,
    handleFileSelect,
    navigateUp,
    navigateToPath,
    moveToTrash,
    restoreFromTrash,
    emptyTrash,
    trashItems,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    saveFile,
    renameFile,
  } = useFileSystem();

  // Update storage space periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStorageSpace(calculateStorageSpace());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle initial path from launch event
  useEffect(() => {
    const initialPath = localStorage.getItem("app_finder_initialPath");
    if (initialPath) {
      navigateToPath(initialPath);
      localStorage.removeItem("app_finder_initialPath");
    }
  }, [navigateToPath]);

  // Save view and sort preferences when they change
  useEffect(() => {
    localStorage.setItem("finder_view_type", viewType);
  }, [viewType]);

  useEffect(() => {
    localStorage.setItem("finder_sort_type", sortType);
  }, [sortType]);

  const sortedFiles = [...files].sort((a, b) => {
    switch (sortType) {
      case "name":
        return a.name.localeCompare(b.name);
      case "kind": {
        // Sort by directory first, then by file extension
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        const extA = a.name.split(".").pop() || "";
        const extB = b.name.split(".").pop() || "";
        return extA.localeCompare(extB) || a.name.localeCompare(b.name);
      }
      case "size":
        // For now, directories are considered smaller than files
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return 0;
      case "date":
        // We'll need to add date metadata to FileItem to properly implement this
        return 0;
      default:
        return 0;
    }
  });

  const handleEmptyTrash = () => {
    setIsEmptyTrashDialogOpen(true);
  };

  const confirmEmptyTrash = () => {
    emptyTrash();
    setIsEmptyTrashDialogOpen(false);
  };

  // Function to handle file drops
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    // Only allow drops in the Documents directory
    if (currentPath !== "/Documents") {
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      // Only accept text and markdown files
      if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) {
        return;
      }

      const text = await file.text();

      // Save the file to the virtual filesystem
      saveFile({
        name: file.name,
        path: `/Documents/${file.name}`,
        content: text,
        icon: "/icons/file-text.png",
        isDirectory: false,
      });
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only accept text and markdown files
      if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) {
        return;
      }

      const text = await file.text();

      // Save the file to the virtual filesystem
      saveFile({
        name: file.name,
        path: `${currentPath}/${file.name}`,
        content: text,
        icon: "/icons/file-text.png",
        isDirectory: false,
      });

      // Clear the input
      e.target.value = "";
    }
  };

  const handleRename = () => {
    if (!selectedFile) return;
    setRenameValue(selectedFile.name);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = (newName: string) => {
    if (!selectedFile || !newName) return;

    // Only proceed if the name actually changed
    if (selectedFile.name === newName) {
      setIsRenameDialogOpen(false);
      return;
    }

    // Rename the file
    renameFile(selectedFile.name, newName);

    // Close dialog
    setIsRenameDialogOpen(false);
  };

  const handleDuplicate = () => {
    if (!selectedFile) return;

    // Create a copy name by adding " (copy)" before the extension
    const ext = selectedFile.name.includes(".")
      ? `.${selectedFile.name.split(".").pop()}`
      : "";
    const baseName = selectedFile.name.replace(ext, "");
    const copyName = `${baseName} (copy)${ext}`;

    // Save the duplicate file
    saveFile({
      ...selectedFile,
      name: copyName,
      path: `${currentPath}/${copyName}`,
    });
  };

  const handleRestore = () => {
    if (!selectedFile) return;
    restoreFromTrash(selectedFile);
  };

  if (!isWindowOpen) return null;

  return (
    <>
      <FinderMenuBar
        onClose={onClose}
        onShowHelp={() => setIsHelpDialogOpen(true)}
        onShowAbout={() => setIsAboutDialogOpen(true)}
        viewType={viewType}
        onViewTypeChange={setViewType}
        sortType={sortType}
        onSortTypeChange={setSortType}
        selectedFile={selectedFile}
        onMoveToTrash={moveToTrash}
        onEmptyTrash={handleEmptyTrash}
        onRestore={handleRestore}
        isTrashEmpty={trashItems.length === 0}
        isInTrash={Boolean(
          selectedFile?.path === "/Trash" ||
            selectedFile?.path.startsWith("/Trash/")
        )}
        onNavigateBack={navigateBack}
        onNavigateForward={navigateForward}
        canNavigateBack={canNavigateBack()}
        canNavigateForward={canNavigateForward()}
        onNavigateToPath={navigateToPath}
        onImportFile={handleImportFile}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".txt,.md,text/*"
        onChange={handleFileInputChange}
      />
      <WindowFrame
        appId="finder"
        title={
          currentPath === "/"
            ? "Macintosh HD"
            : currentPath.split("/").filter(Boolean).pop() || "Finder"
        }
        onClose={onClose}
        isForeground={isForeground}
      >
        <div
          className={`flex flex-col h-full w-full bg-white relative ${
            isDraggingOver && currentPath === "/Documents"
              ? "after:absolute after:inset-0 after:bg-black/20"
              : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDraggingOver && currentPath === "/Documents") {
              setIsDraggingOver(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Check if we're leaving to a child element
            const relatedTarget = e.relatedTarget as Node | null;
            if (e.currentTarget.contains(relatedTarget)) {
              return;
            }
            setIsDraggingOver(false);
          }}
          onDragEnd={() => setIsDraggingOver(false)}
          onMouseLeave={() => setIsDraggingOver(false)}
          onDrop={handleFileDrop}
        >
          <div className="flex flex-col gap-1 p-1 bg-gray-100 border-b border-black">
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateBack}
                  disabled={!canNavigateBack()}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateForward}
                  disabled={!canNavigateForward()}
                  className="h-8 w-8"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateUp}
                  disabled={currentPath === "/"}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4 rotate-90" />
                </Button>
              </div>
              <Input
                ref={pathInputRef}
                value={currentPath}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  navigateToPath(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigateToPath((e.target as HTMLInputElement).value);
                  }
                }}
                className="flex-1"
                placeholder="Enter path"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                Loading...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                {error}
              </div>
            ) : (
              <FileList
                files={sortedFiles}
                onFileOpen={handleFileOpen}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                viewType={viewType}
              />
            )}
          </div>
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-geneva-12 bg-gray-100 border-t border-gray-300">
            <span>
              {sortedFiles.length} item{sortedFiles.length !== 1 ? "s" : ""}
            </span>
            <span>
              {Math.round((storageSpace.available / 1024 / 1024) * 10) / 10} MB
              available
            </span>
          </div>
        </div>
      </WindowFrame>
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onOpenChange={setIsHelpDialogOpen}
        appName="Finder"
        helpItems={helpItems}
      />
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onOpenChange={setIsAboutDialogOpen}
        metadata={appMetadata}
      />
      <ConfirmDialog
        isOpen={isEmptyTrashDialogOpen}
        onOpenChange={setIsEmptyTrashDialogOpen}
        onConfirm={confirmEmptyTrash}
        title="Empty Trash"
        description="Are you sure you want to empty the Trash? This action cannot be undone."
      />
      <InputDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onSubmit={handleRenameSubmit}
        title="Rename File"
        description="Enter a new name for the file"
        value={renameValue}
        onChange={setRenameValue}
      />
    </>
  );
}
