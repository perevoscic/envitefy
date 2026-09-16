type RecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type ChatSpeechWindow = {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
  navigator: { language: string };
};

export type ChatDictation = {
  stop: () => void;
  cancel: () => void;
};

/** Dictation only fills the composer; the person still chooses when to send. */
export function startChatDictation(
  browser: ChatSpeechWindow,
  callbacks: {
    onTranscript: (text: string) => void;
    onListeningChange: (listening: boolean) => void;
    onError: (message: string) => void;
  },
): ChatDictation | null {
  const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    callbacks.onError("Voice input is not supported in this browser. You can still type your message.");
    return null;
  }

  const recognition = new SpeechRecognition();
  let active = true;
  let nextResult = 0;
  const finish = () => {
    if (!active) return;
    active = false;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    callbacks.onListeningChange(false);
  };
  const cancel = () => {
    if (!active) return;
    finish();
    recognition.abort();
  };

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = browser.navigator.language || "en-US";
  recognition.onresult = (event) => {
    if (!active) return;
    const parts: string[] = [];
    for (let index = Math.max(event.resultIndex, nextResult); index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result.isFinal) break;
      const transcript = result[0]?.transcript.trim();
      if (transcript) parts.push(transcript);
      nextResult = index + 1;
    }
    if (parts.length) callbacks.onTranscript(parts.join(" "));
  };
  recognition.onerror = ({ error }) => {
    if (!active) return;
    if (error !== "aborted") {
      callbacks.onError(
        error === "not-allowed" || error === "service-not-allowed"
          ? "Microphone access was denied. Allow it in your browser settings to use voice input."
          : error === "audio-capture"
            ? "No microphone is available. Connect a microphone and try again."
            : error === "no-speech"
              ? "No speech was heard. Tap the microphone to try again."
              : "Voice input was interrupted. Check your connection and try again.",
      );
    }
    cancel();
  };
  recognition.onend = finish;

  callbacks.onListeningChange(true);
  try {
    recognition.start();
  } catch {
    finish();
    callbacks.onError("Unable to start the microphone. Please try again.");
    return null;
  }

  return {
    stop: () => { if (active) recognition.stop(); },
    cancel,
  };
}
