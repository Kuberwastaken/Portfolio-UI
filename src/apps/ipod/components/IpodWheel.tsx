import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

type WheelArea = "top" | "right" | "bottom" | "left" | "center";
type RotationDirection = "clockwise" | "counterclockwise";

interface IpodWheelProps {
  theme: string;
  onWheelClick: (area: WheelArea) => void;
  onWheelRotation: (direction: RotationDirection) => void;
  onMenuButton: () => void;
}

const touchEventThrottleMs = 50;

export function IpodWheel({
  theme,
  onWheelClick,
  onWheelRotation,
  onMenuButton,
}: IpodWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelDelta, setWheelDelta] = useState(0);
  const [touchStartAngle, setTouchStartAngle] = useState<number | null>(null);
  const [lastTouchEventTime, setLastTouchEventTime] = useState(0);

  // Calculate angle from center of wheel
  const getAngleFromCenter = (x: number, y: number): number => {
    if (!wheelRef.current) return 0;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
  };

  // Determine wheel section from angle
  const getWheelSection = (angle: number): WheelArea => {
    if (angle >= -45 && angle < 45) {
      return "right";
    } else if (angle >= 45 && angle < 135) {
      return "bottom";
    } else if (angle >= 135 || angle < -135) {
      return "left";
    } else {
      // Default to top, but this section is primarily for the menu button
      return "top";
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const angle = getAngleFromCenter(touch.clientX, touch.clientY);
    setTouchStartAngle(angle);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartAngle === null) return;

    const now = Date.now();
    // Throttle touch events to prevent over-triggering
    if (now - lastTouchEventTime < touchEventThrottleMs) return;

    const touch = e.touches[0];
    const currentAngle = getAngleFromCenter(touch.clientX, touch.clientY);

    // Calculate the difference in angle
    let angleDifference = currentAngle - touchStartAngle;

    // Handle the case where we cross the -180/180 boundary
    if (angleDifference > 180) angleDifference -= 360;
    if (angleDifference < -180) angleDifference += 360;

    // Update rotation direction when the difference is large enough
    // Reduced threshold from 15 to 8 for more sensitive rotation
    if (Math.abs(angleDifference) > 8) {
      if (angleDifference > 0) {
        onWheelRotation("clockwise");
      } else {
        onWheelRotation("counterclockwise");
      }
      setTouchStartAngle(currentAngle);
      setLastTouchEventTime(now);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setTouchStartAngle(null);
  };

  // Handle mouse wheel scroll for rotation
  const handleMouseWheel = (e: React.WheelEvent) => {
    // Accumulate delta and only trigger when it reaches threshold
    const newDelta = wheelDelta + Math.abs(e.deltaY);
    setWheelDelta(newDelta);

    // Using a threshold of 50 to reduce sensitivity
    if (newDelta >= 50) {
      if (e.deltaY < 0) {
        onWheelRotation("counterclockwise");
      } else {
        onWheelRotation("clockwise");
      }
      // Reset delta after triggering action
      setWheelDelta(0);
    }
  };

  // Handle mouse down for clicks (excluding menu button)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't handle wheel clicks if we're clicking on the menu button
    if (
      e.target &&
      (e.target as HTMLElement).classList.contains("menu-button")
    ) {
      return;
    }
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    const section = getWheelSection(angle);
    onWheelClick(section);
  };

  return (
    <div
      className={cn(
        "mt-6 relative w-[180px] h-[180px] rounded-full flex items-center justify-center",
        theme === "classic" ? "bg-gray-300/60" : "bg-neutral-800/50"
      )}
    >
      {/* Center button */}
      <button
        onClick={() => onWheelClick("center")}
        className={cn(
          "absolute w-16 h-16 rounded-full z-10 flex items-center justify-center",
          theme === "classic" ? "bg-white/30" : "bg-black/40"
        )}
      />

      {/* Wheel sections */}
      <div
        ref={wheelRef}
        className="absolute w-full h-full rounded-full"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleMouseWheel}
      >
        {/* Wheel labels - no click handlers */}
        <div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 font-chicago text-xs text-white menu-button cursor-default"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering wheel mousedown
            onMenuButton();
          }}
        >
          MENU
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 font-chicago text-[9px] text-white cursor-default">
          ▶︎▶︎
        </div>
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 font-chicago text-[9px] text-white cursor-default">
          ▶︎❙❙
        </div>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 font-chicago text-[9px] text-white cursor-default">
          ◀︎◀︎
        </div>
      </div>
    </div>
  );
} 