export type TimingStep = {
  name: string;
  durMs: number;
};

const TIMING_TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function isTimingRequested(input: URL | Request): boolean {
  const url = input instanceof URL ? input : new URL(input.url);
  const raw = String(url.searchParams.get("timing") || "").trim().toLowerCase();
  return TIMING_TRUE_VALUES.has(raw);
}

export class ServerTimingTracker {
  public readonly enabled: boolean;
  private readonly requestStartMs: number;
  private readonly steps: TimingStep[] = [];

  constructor(enabled: boolean) {
    this.enabled = enabled;
    this.requestStartMs = nowMs();
  }

  addStep(name: string, durMs: number) {
    if (!this.enabled) return;
    const normalized = Number.isFinite(durMs) ? Math.max(0, durMs) : 0;
    this.steps.push({ name, durMs: normalized });
  }

  async time<T>(name: string, work: () => Promise<T>): Promise<T> {
    if (!this.enabled) return work();
    const started = nowMs();
    try {
      return await work();
    } finally {
      this.addStep(name, nowMs() - started);
    }
  }

  timeSync<T>(name: string, work: () => T): T {
    if (!this.enabled) return work();
    const started = nowMs();
    try {
      return work();
    } finally {
      this.addStep(name, nowMs() - started);
    }
  }

  getTotalMs(): number {
    return Math.max(0, nowMs() - this.requestStartMs);
  }

  toObject(extra?: Record<string, unknown>): Record<string, unknown> {
    if (!this.enabled) return {};
    const steps = this.steps.map((step) => ({
      name: step.name,
      durMs: Number(step.durMs.toFixed(2)),
    }));
    return {
      totalMs: Number(this.getTotalMs().toFixed(2)),
      steps,
      ...(extra || {}),
    };
  }

  toHeaderValue(): string | null {
    if (!this.enabled) return null;
    const segments = this.steps.map((step) => {
      const token = step.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      return `${token};dur=${step.durMs.toFixed(2)}`;
    });
    segments.push(`total;dur=${this.getTotalMs().toFixed(2)}`);
    return segments.join(", ");
  }

  applyHeader(response: Response) {
    if (!this.enabled) return;
    const headerValue = this.toHeaderValue();
    if (!headerValue) return;
    response.headers.set("Server-Timing", headerValue);
  }
}

export function createServerTimingTracker(enabled: boolean): ServerTimingTracker {
  return new ServerTimingTracker(enabled);
}
