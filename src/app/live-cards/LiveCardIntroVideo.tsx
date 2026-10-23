"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./livecard-intro.module.css";

export default function LiveCardIntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playAttempt = useRef(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  function showError() {
    setStarted(false);
    setError(true);
  }

  async function play() {
    const attempt = ++playAttempt.current;
    setError(false);
    setStarted(true);
    try {
      if (error) videoRef.current?.load();
      await videoRef.current?.play();
    } catch {
      if (attempt === playAttempt.current) showError();
    }
  }

  return (
    <div className={styles.demoPlayer}>
      <video
        ref={videoRef}
        className={styles.demoVideo}
        controls={started}
        muted
        playsInline
        preload="none"
        onError={showError}
        poster="/images/live-card-demo-poster.webp"
        width={720}
        height={1080}
        aria-label="Live Card demo: event details, RSVP, directions and calendar"
        aria-describedby="live-card-demo-caption"
      >
        <source src="/videos/live-card-demo.mp4" type="video/mp4" onError={showError} />
        <track kind="captions" src="/videos/live-card-demo.vtt" srcLang="en" label="English" />
        <a href="/videos/live-card-demo.mp4">Watch the Live Card demo</a>
      </video>
      {!started && (
        <button
          type="button"
          className={styles.playButton}
          onClick={() => void play()}
          aria-label={error ? "Try playing the Live Card demo again" : "Play the Live Card demo"}
        >
          <span className={styles.playButtonLabel}>
            <Play size={18} fill="currentColor" aria-hidden="true" />
            {error ? "Try again" : "Watch demo"}
          </span>
        </button>
      )}
      {error && (
        <p className={styles.videoError} role="status">
          The video couldn’t load. Try again.
        </p>
      )}
    </div>
  );
}
