"use client";

import type { ShaderMount } from "@paper-design/shaders";
import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./LiquidMetalButton.module.css";

type LiquidMetalButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label?: string;
};

type Ripple = { id: number; x: number; y: number };

export function LiquidMetalButton({
  label = "Let's create",
  className,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  type = "button",
  ...buttonProps
}: LiquidMetalButtonProps) {
  const shaderRef = useRef<HTMLSpanElement>(null);
  const mountRef = useRef<ShaderMount | null>(null);
  const reducedMotionRef = useRef(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const burstingRef = useRef(false);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nextRippleId = useRef(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const updateSpeed = useCallback(() => {
    const speed = reducedMotionRef.current
      ? 0
      : burstingRef.current
        ? 2.4
        : hoveredRef.current || focusedRef.current
          ? 1
          : 0.6;
    mountRef.current?.setSpeed(speed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = shaderRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rippleTimers = rippleTimersRef.current;

    const clearBurst = () => {
      if (burstTimerRef.current !== null) {
        clearTimeout(burstTimerRef.current);
        burstTimerRef.current = null;
      }
      burstingRef.current = false;
    };

    const handleMotionPreference = () => {
      reducedMotionRef.current = preference.matches;
      if (preference.matches) {
        clearBurst();
        for (const timer of rippleTimers) clearTimeout(timer);
        rippleTimers.clear();
        setRipples([]);
      }
      updateSpeed();
    };

    handleMotionPreference();
    preference.addEventListener("change", handleMotionPreference);

    // Keep the shader library outside the public header's initial JavaScript bundle.
    void import("@paper-design/shaders")
      .then(({ ShaderMount: Mount, liquidMetalFragmentShader, ShaderFitOptions }) => {
        if (cancelled || !host) return;
        mountRef.current = new Mount(
          host,
          liquidMetalFragmentShader,
          {
            u_colorBack: [0, 0, 0, 1],
            u_colorTint: [1, 1, 1, 0],
            u_isImage: false,
            u_imageAspectRatio: 1,
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0,
            u_shiftBlue: 0,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_shape: 1,
            u_fit: ShaderFitOptions.contain,
            u_scale: 8,
            u_rotation: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
            u_worldWidth: 0,
            u_worldHeight: 0,
          },
          undefined,
          0,
          0,
          2,
          128_000,
        );
        updateSpeed();
      })
      .catch(() => {
        // The themed CSS rim remains visible if WebGL or the lazy chunk is unavailable.
        if (!cancelled) host?.replaceChildren();
      });

    return () => {
      cancelled = true;
      preference.removeEventListener("change", handleMotionPreference);
      clearBurst();
      for (const timer of rippleTimers) clearTimeout(timer);
      rippleTimers.clear();
      mountRef.current?.dispose();
      mountRef.current = null;
    };
  }, [updateSpeed]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!reducedMotionRef.current) {
      if (burstTimerRef.current !== null) clearTimeout(burstTimerRef.current);
      burstingRef.current = true;
      updateSpeed();
      burstTimerRef.current = setTimeout(() => {
        burstTimerRef.current = null;
        burstingRef.current = false;
        updateSpeed();
      }, 300);

      const bounds = event.currentTarget.getBoundingClientRect();
      const ripple = {
        id: nextRippleId.current++,
        x: event.detail === 0 ? bounds.width / 2 : event.clientX - bounds.left,
        y: event.detail === 0 ? bounds.height / 2 : event.clientY - bounds.top,
      };
      setRipples((current) => [...current, ripple]);
      const timer = setTimeout(() => {
        rippleTimersRef.current.delete(timer);
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, 600);
      rippleTimersRef.current.add(timer);
    }
    onClick?.(event);
  };

  return (
    <button
      {...buttonProps}
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      data-liquid-metal-button=""
      onClick={handleClick}
      onPointerEnter={(event) => {
        hoveredRef.current = true;
        updateSpeed();
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        hoveredRef.current = false;
        updateSpeed();
        onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        focusedRef.current = true;
        updateSpeed();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        updateSpeed();
        onBlur?.(event);
      }}
    >
      <span
        ref={shaderRef}
        className={styles.shader}
        data-liquid-metal-shader=""
        aria-hidden="true"
      />
      <span className={styles.inset} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.ripples} aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
      </span>
    </button>
  );
}

export default LiquidMetalButton;
