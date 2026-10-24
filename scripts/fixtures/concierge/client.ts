import { requestGuestChatAnswer as requestAnswer } from "../../../src/lib/guest-chat/client";

type ControlledRequest = {
  message: string;
  history: Parameters<typeof requestAnswer>[0]["history"];
  signal?: AbortSignal;
  delta: (text: string) => void;
  resolve: (answer: Awaited<ReturnType<typeof requestAnswer>>) => void;
  reject: (error: Error) => void;
};

declare global {
  interface Window {
    conciergeControlledRequests?: ControlledRequest[];
  }
}

export function requestGuestChatAnswer(...args: Parameters<typeof requestAnswer>) {
  if (!new URLSearchParams(window.location.search).has("controlled")) return requestAnswer(...args);
  const [params, options] = args;
  // Deliberately ignore abort so UI reset guards must reject stale callbacks themselves.
  return new Promise<Awaited<ReturnType<typeof requestAnswer>>>((resolve, reject) => {
    window.conciergeControlledRequests ||= [];
    window.conciergeControlledRequests.push({
      message: params.message,
      history: params.history,
      signal: options?.signal,
      delta: (text) => params.onDelta?.(text),
      resolve,
      reject,
    });
  });
}
