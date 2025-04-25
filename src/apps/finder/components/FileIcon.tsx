import { useSound, Sounds } from "@/hooks/useSound";
import { useEffect, useState, useRef } from "react";

interface FileIconProps {
  name: string;
  isDirectory: boolean;
  icon?: string;
  content?: string | Blob;
  contentUrl?: string;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  size?: "small" | "large";
  className?: string;
}

export function FileIcon({
  name,
  isDirectory,
  icon,
  content,
  contentUrl,
  onDoubleClick,
  isSelected,
  onClick,
  size = "small",
  className,
}: FileIconProps) {
  const { play: playClick } = useSound(Sounds.BUTTON_CLICK, 0.3);
  const [imgSrc, setImgSrc] = useState<string | undefined>(contentUrl);
  const [fallbackToIcon, setFallbackToIcon] = useState(false);
  const attemptedUrlsRef = useRef<Set<string>>(new Set());
  const blobUrlRef = useRef<string | null>(null);
  const contentRef = useRef(content);
  const contentUrlRef = useRef(contentUrl);

  // Track props with refs to avoid dependency issues
  useEffect(() => {
    contentRef.current = content;
    contentUrlRef.current = contentUrl;
  }, [content, contentUrl]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Setup image source once on mount, or when key props change
  useEffect(() => {
    // Skip if we're already showing the icon
    if (fallbackToIcon) return;

    // Clear attempted URLs when setup runs
    attemptedUrlsRef.current.clear();

    // Try contentUrl first if available
    if (contentUrl && !attemptedUrlsRef.current.has(contentUrl)) {
      attemptedUrlsRef.current.add(contentUrl);
      setImgSrc(contentUrl);
      return;
    }

    // If no contentUrl or it failed, try using content
    if (content) {
      if (content instanceof Blob) {
        // Revoke previous URL if exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        // Create new object URL
        const url = URL.createObjectURL(content);
        blobUrlRef.current = url;
        attemptedUrlsRef.current.add(url);
        setImgSrc(url);
      } else if (
        typeof content === "string" &&
        !attemptedUrlsRef.current.has(content)
      ) {
        attemptedUrlsRef.current.add(content);
        setImgSrc(content);
      }
    }
  }, [contentUrl, content]); // Don't include fallbackToIcon in deps

  const isImage = () => {
    const ext = name.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");
  };

  const getIconPath = () => {
    if (icon) return icon;
    if (isDirectory) return "/icons/directory.png";
    if (name.endsWith(".txt") || name.endsWith(".md"))
      return "/icons/file-text.png";
    return "/icons/file.png";
  };

  const sizeClasses = {
    small: {
      container: "w-[80px]",
      icon: "w-12 h-12",
      image: "w-[32px] h-[32px]",
      text: "text-[10px] max-w-[90px]",
    },
    large: {
      container: "w-24",
      icon: "w-16 h-16",
      image: "w-12 h-12",
      text: "text-[12px] max-w-[96px]",
    },
  };

  const sizes = sizeClasses[size];

  const handleImageError = () => {
    console.error(`Error loading thumbnail for ${name}, falling back to icon`);

    // If we have a Blob but URL failed, try regenerating URL one time
    if (
      !fallbackToIcon &&
      contentRef.current instanceof Blob &&
      blobUrlRef.current &&
      imgSrc === blobUrlRef.current
    ) {
      // Only try once per blob to avoid loops
      if (!attemptedUrlsRef.current.has("blob-retry")) {
        attemptedUrlsRef.current.add("blob-retry");

        // Revoke current URL
        URL.revokeObjectURL(blobUrlRef.current);

        // Create new URL from the same blob
        const newUrl = URL.createObjectURL(contentRef.current);
        blobUrlRef.current = newUrl;
        setImgSrc(newUrl);
        return;
      }
    }

    // Otherwise fall back to icon
    setFallbackToIcon(true);
  };

  const renderIcon = () => {
    if (isImage() && imgSrc && !fallbackToIcon) {
      return (
        <div
          className={`relative ${sizes.icon} flex items-center justify-center`}
        >
          <img
            src={imgSrc}
            alt={name}
            className={`object-cover ${sizes.image} rounded`}
            onError={handleImageError}
          />
        </div>
      );
    }

    return (
      <img
        src={getIconPath()}
        alt={isDirectory ? "Directory" : "File"}
        className={`object-contain ${sizes.image}`}
        style={{ imageRendering: "pixelated" }}
      />
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-start cursor-pointer gap-1 ${sizes.container} ${className}`}
      onDoubleClick={onDoubleClick}
      onClick={(e) => {
        playClick();
        onClick?.(e);
      }}
    >
      <div
        className={`flex items-center justify-center ${sizes.icon} ${
          isSelected ? "brightness-65 contrast-100" : ""
        }`}
      >
        {renderIcon()}
      </div>
      <span
        className={`text-center px-1 font-geneva-12 break-words truncate ${
          sizes.text
        } ${isSelected ? "bg-black text-white" : "bg-white text-black"}`}
      >
        {name}
      </span>
    </div>
  );
}
