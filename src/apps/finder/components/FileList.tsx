import { FileIcon } from "./FileIcon";
import { ViewType } from "./FinderMenuBar";
import { useSound, Sounds } from "@/hooks/useSound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
  icon?: string;
  appId?: string; // For application files
  content?: string | Blob; // For document files or images
  contentUrl?: string; // For blob URLs
  size?: number; // File size in bytes
  modifiedAt?: Date; // Last modified date
  type?: string;
}

interface FileListProps {
  files: FileItem[];
  onFileOpen: (file: FileItem) => void;
  onFileSelect: (file: FileItem) => void;
  selectedFile?: FileItem;
  viewType?: ViewType;
}

// Helper function to get human-readable file type
function getHumanReadableType(file: FileItem): string {
  if (file.isDirectory) return "Folder";
  if (file.appId) return "Application";
  if (!file.type) return "Document";

  switch (file.type) {
    case "image":
      return "Image";
    case "markdown":
      return "Markdown Document";
    case "text":
      return "Text Document";
    case "application":
      return "Application";
    case "directory":
      return "Folder";
    default:
      return file.type.charAt(0).toUpperCase() + file.type.slice(1);
  }
}

export function FileList({
  files,
  onFileOpen,
  onFileSelect,
  selectedFile,
  viewType = "small",
}: FileListProps) {
  const { play: playClick } = useSound(Sounds.BUTTON_CLICK, 0.3);

  const handleFileOpen = (file: FileItem) => {
    playClick();
    onFileOpen(file);
    onFileSelect(null as unknown as FileItem); // Clear selection with proper typing
  };

  const handleFileSelect = (file: FileItem) => {
    playClick();
    onFileSelect(file);
  };

  if (viewType === "list") {
    return (
      <div className="font-geneva-12">
        <Table>
          <TableHeader>
            <TableRow className="text-[9px] border-none font-normal">
              <TableHead className="font-normal bg-gray-100/50 h-[28px]">
                Name
              </TableHead>
              <TableHead className="font-normal bg-gray-100/50 h-[28px]">
                Type
              </TableHead>
              <TableHead className="font-normal bg-gray-100/50 h-[28px]">
                Size
              </TableHead>
              <TableHead className="font-normal bg-gray-100/50 h-[28px]">
                Modified
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-[10px]">
            {files.map((file) => (
              <TableRow
                key={file.path}
                className={`border-none hover:bg-gray-100/50 transition-colors cursor-default ${
                  selectedFile?.path === file.path
                    ? "bg-black text-white hover:bg-black"
                    : "odd:bg-gray-200/50"
                }`}
                onClick={() => handleFileSelect(file)}
                onDoubleClick={() => handleFileOpen(file)}
              >
                <TableCell className="flex items-center gap-2">
                  <img
                    src={file.icon}
                    alt={file.isDirectory ? "Directory" : "File"}
                    className={`w-4 h-4 ${
                      selectedFile?.path === file.path ? "invert" : ""
                    }`}
                    style={{ imageRendering: "pixelated" }}
                  />
                  {file.name}
                </TableCell>
                <TableCell>{getHumanReadableType(file)}</TableCell>
                <TableCell>
                  {file.size
                    ? file.size < 1024
                      ? `${file.size} B`
                      : file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : "--"}
                </TableCell>
                <TableCell>
                  {file.modifiedAt
                    ? new Date(file.modifiedAt).toLocaleDateString()
                    : "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 p-2">
      {files.map((file) => (
        <FileIcon
          key={file.path}
          name={file.name}
          isDirectory={file.isDirectory}
          icon={file.icon}
          content={file.type === "image" ? file.content : undefined}
          contentUrl={file.type === "image" ? file.contentUrl : undefined}
          onDoubleClick={() => handleFileOpen(file)}
          onClick={() => handleFileSelect(file)}
          isSelected={selectedFile?.path === file.path}
          size={viewType === "large" ? "large" : "small"}
        />
      ))}
    </div>
  );
}
