import SnapLaunchCards from "@/app/event/SnapLaunchCards";
import { themeColorPalette } from "@/lib/theme-color";
import styles from "./snap-upload-start.module.css";

export default function SnapUploadStart() {
  return (
    <main
      data-snap-upload-intro
      className={styles.start}
      data-theme-color={themeColorPalette.eventFallback}
    >
      <div className={styles.workspace}>
        <section className={styles.copy} aria-labelledby="snap-heading">
          <p className={styles.eyebrow}>Snap a Flyer</p>
          <h1 id="snap-heading" className={styles.heading}>
            A paper invite.
            <br />
            <span>A digital event.</span>
          </h1>
          <p className={styles.intro}>
            Snapping means taking a photo. Turn that birthday flyer on your fridge into an event you
            can add to your calendar and a digital link you can share.
          </p>
          <p className={styles.explanation}>
            Take a photo or upload a file. Envitefy reads the title, date, time and place to create
            your saved event.
          </p>
        </section>

        <figure className={styles.example}>
          <div className={styles.videoFrame}>
            <video
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/images/snap-gymnastics-demo-poster.webp"
              width={720}
              height={1280}
              aria-label="Watch a gymnastics poster become a digital event"
              aria-describedby="snap-demo-caption"
            >
              <source
                src="/videos/snap-gymnastics-demo.webm"
                type='video/webm; codecs="vp9, vorbis"'
              />
              <source src="/videos/snap-gymnastics-demo.mp4" type="video/mp4" />
              <a href="/videos/snap-gymnastics-demo.mp4">Watch the Snap demonstration</a>
            </video>
          </div>
          <figcaption id="snap-demo-caption" className={styles.caption}>
            <span className={styles.captionTitle}>See Snap in action</span>A photo of a gymnastics
            poster becomes a digital event with meet details and calendar options.
          </figcaption>
        </figure>

        <div className={styles.actions}>
          <SnapLaunchCards processInPage variant="explained" />
          <p className={styles.formats}>Invitations, flyers, screenshots, schedules &amp; PDFs</p>
        </div>
      </div>
    </main>
  );
}
