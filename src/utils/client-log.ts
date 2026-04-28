"use client";

type ClientLogDetails = Record<string, unknown>;

export function createClientAttemptId(prefix = "scan"): string {
  try {
    const randomId = window.crypto?.randomUUID?.();
    if (randomId) return `${prefix}_${randomId}`;
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getClientEnvironmentSnapshot(): ClientLogDetails {
  if (typeof window === "undefined") return {};
  const nav = window.navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  };
  return {
    onLine: nav.onLine,
    userAgent: nav.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    connection: nav.connection
      ? {
          effectiveType: nav.connection.effectiveType,
          downlink: nav.connection.downlink,
          rtt: nav.connection.rtt,
          saveData: nav.connection.saveData,
        }
      : null,
  };
}

export function reportClientLog(params: {
  area: string;
  stage: string;
  scanAttemptId?: string | null;
  details?: ClientLogDetails;
  error?: unknown;
}): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Record<string, unknown> = {
      area: params.area,
      stage: params.stage,
      scanAttemptId: params.scanAttemptId || null,
      details: params.details || null,
      environment: getClientEnvironmentSnapshot(),
      timestamp: new Date().toISOString(),
    };
    const error = params.error;
    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      payload.error = { message: String(error) };
    }

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/client-log",
        new Blob([body], { type: "application/json" }),
      );
      if (sent) return;
    }
    void fetch("/api/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
