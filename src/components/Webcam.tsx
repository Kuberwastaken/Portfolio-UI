import { useEffect, useRef, useState } from "react";
import { CameraOff } from "lucide-react";

interface WebcamProps {
  onPhoto?: (photoDataUrl: string) => void;
  className?: string;
  isPreview?: boolean;
  filter?: string;
  onStreamReady?: (stream: MediaStream) => void;
  sharedStream?: MediaStream | null;
  selectedCameraId?: string | null;
}

export function Webcam({
  onPhoto,
  className = "",
  isPreview = false,
  filter = "none",
  onStreamReady,
  sharedStream,
  selectedCameraId,
}: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start camera when component mounts or shared stream changes
  useEffect(() => {
    if (!isPreview) {
      startCamera();
      return () => stopCamera();
    } else if (sharedStream) {
      setStream(sharedStream);
      if (videoRef.current) {
        videoRef.current.srcObject = sharedStream;
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPreview, sharedStream, selectedCameraId]);

  // Handle stream ready callback
  useEffect(() => {
    if (stream && onStreamReady && !isPreview) {
      onStreamReady(stream);
    }
  }, [stream, onStreamReady, isPreview]);

  // Listen for webcam-capture events
  useEffect(() => {
    const handleCapture = () => {
      if (videoRef.current && stream) {
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Reset any existing transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply the filter first
        ctx.filter = filter;
        console.log("Applying filter during capture:", filter);

        // Then apply the horizontal flip
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

        // Convert to JPEG data URL
        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.85);

        // Call the onPhoto callback
        onPhoto?.(photoDataUrl);

        // Dispatch a custom event with the photo data URL for other components to use
        const photoTakenEvent = new CustomEvent("photo-taken", {
          detail: photoDataUrl,
        });
        window.dispatchEvent(photoTakenEvent);
      }
    };

    if (!isPreview) {
      window.addEventListener("webcam-capture", handleCapture);
      return () => window.removeEventListener("webcam-capture", handleCapture);
    }
  }, [stream, onPhoto, isPreview, filter]);

  const startCamera = async () => {
    try {
      const constraints = {
        audio: false,
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(err instanceof Error ? err.message : "Failed to access camera");
    }
  };

  const stopCamera = () => {
    if (stream && !isPreview) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {error ? (
        <div
          className="w-full h-full flex items-center justify-center"
          onClick={startCamera}
        >
          <CameraOff size={48} className="text-white/30 cursor-pointer" />
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ filter, transform: "scaleX(-1)" }}
        />
      )}
    </div>
  );
}
