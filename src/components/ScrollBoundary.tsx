import { useCallback, useRef, useState, useEffect } from "react";
import type { HTMLAttributes, WheelEvent, TouchEvent } from "react";

type ScrollBoundaryProps = HTMLAttributes<HTMLDivElement>;

const SCROLL_FUDGE = 1;

const ScrollBoundary = ({
  children,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  ...rest
}: ScrollBoundaryProps) => {
  const touchStartY = useRef<number | null>(null);
  const [interacting, setInteracting] = useState(false);
  const originalBodyOverflow = useRef<string>();

  const isAtBoundary = useCallback((target: HTMLDivElement, deltaY: number) => {
    const scrollTop = target.scrollTop;
    const maxScroll = target.scrollHeight - target.clientHeight;
    const atTop = scrollTop <= SCROLL_FUDGE;
    const atBottom = scrollTop >= maxScroll - SCROLL_FUDGE;
    return (atTop && deltaY < 0) || (atBottom && deltaY > 0);
  }, []);

  const handleWheelCapture = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (isAtBoundary(event.currentTarget, event.deltaY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [isAtBoundary]
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      onWheel?.(event);
    },
    [onWheel]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      touchStartY.current = event.touches[0]?.clientY ?? null;
      onTouchStart?.(event);
      setInteracting(true);
    },
    [onTouchStart]
  );

  const handleTouchMoveCapture = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStartY.current === null) return;
      const currentY = event.touches[0]?.clientY ?? touchStartY.current;
      const deltaY = touchStartY.current - currentY;
      if (isAtBoundary(event.currentTarget, deltaY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [isAtBoundary]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      onTouchMove?.(event);
    },
    [onTouchMove]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      touchStartY.current = null;
      onTouchEnd?.(event);
      setInteracting(false);
    },
    [onTouchEnd]
  );

  const handlePointerEnter = () => setInteracting(true);
  const handlePointerLeave = () => setInteracting(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (originalBodyOverflow.current === undefined) {
      originalBodyOverflow.current = document.body.style.overflow;
    }
    if (interacting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalBodyOverflow.current || "";
    }
    return () => {
      document.body.style.overflow = originalBodyOverflow.current || "";
    };
  }, [interacting]);

  return (
    <div
      {...rest}
      onWheelCapture={handleWheelCapture}
      onWheel={handleWheel}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchMoveCapture={handleTouchMoveCapture}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default ScrollBoundary;
