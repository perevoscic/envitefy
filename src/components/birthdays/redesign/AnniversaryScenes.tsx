"use client";

import type { CSSProperties, ReactNode } from "react";
import { ANNIVERSARY_COLLECTION_BY_ID } from "@/data/anniversary-template-data";
import { BirthdaySceneCopy, BirthdaySceneFacts, BirthdaySceneRsvp } from "./primitives";
import type { BirthdaySceneProps } from "./types";
import styles from "./anniversary-scenes.module.css";

export default function AnniversaryScenes(props: BirthdaySceneProps) {
  const { theme, preview } = props;
  const design = ANNIVERSARY_COLLECTION_BY_ID.get(theme.id);
  if (!design) return null;
  const src = theme.decorations?.heroImage || theme.heroImage || design.heroImage;
  const art = (className = "") => (
    <img
      src={src}
      alt=""
      className={`${styles.art} ${className}`}
      loading={preview ? "lazy" : "eager"}
      decoding="async"
    />
  );
  const label = (text: string) => <p className={styles.eyebrow}>{text}</p>;
  const copy = (className = "") => (
    <BirthdaySceneCopy
      {...props}
      className={className}
      titleClassName={styles.title}
      storyClassName={styles.story}
    />
  );
  const facts = <BirthdaySceneFacts {...props} className={styles.facts} />;
  const rsvp = <BirthdaySceneRsvp {...props} className={styles.rsvp} />;
  const details = (
    <div className={styles.details}>
      {facts}
      {rsvp}
    </div>
  );
  let composition: ReactNode;

  switch (theme.id) {
    case "cotton-letter-second-anniversary":
      composition = (
        <div className={styles.letter}>
          <div className={styles.letterPaper}>
            {label("A LOVE LETTER, TOGETHER")}
            {copy()}
            <div className={styles.rule} />
            {details}
          </div>
          <div className={styles.letterPhoto}>
            {art()}
            <span className={styles.caption}>with love, always</span>
          </div>
        </div>
      );
      break;
    case "leather-passport-third-anniversary":
      composition = (
        <div className={styles.passport}>
          <div className={styles.passportHeading}>
            {label("THE JOURNEY CONTINUES")}
            {copy()}
          </div>
          <div className={styles.passportSpread}>
            {art()}
            <div className={styles.passportPage}>
              {label("OUR NEXT CHAPTER")}
              {details}
              <span aria-hidden="true" className={styles.stamp}>
                TOGETHER
                <br />& EVERYWHERE
              </span>
            </div>
          </div>
        </div>
      );
      break;
    case "linen-sunday-fourth-anniversary":
      composition = (
        <div className={styles.linen}>
          {label("YOU HAVE A PLACE AT OUR TABLE")}
          {copy(styles.center)}
          {art(styles.linenPhoto)}
          <div className={styles.linenDetails}>
            {facts}
            {rsvp}
          </div>
        </div>
      );
      break;
    case "iron-rose-sixth-anniversary":
      composition = (
        <div className={styles.iron}>
          <div className={styles.ironArch}>{art()}</div>
          <div className={styles.ironWords}>
            {label("ROOTED IN LOVE")}
            {copy()}
            <span aria-hidden="true" className={styles.flourish}>
              ❦
            </span>
            {details}
          </div>
        </div>
      );
      break;
    case "copper-glow-seventh-anniversary":
      composition = (
        <div className={styles.copper}>
          {art()}
          <div className={styles.copperWords}>
            {label("AN EVENING IN THE AFTERGLOW")}
            {copy()}
            <div className={styles.rule} />
            {details}
          </div>
        </div>
      );
      break;
    case "bronze-hour-eighth-anniversary":
      composition = (
        <div className={styles.bronze}>
          <div className={styles.bronzeTop}>
            {label("A STUDY IN LASTING LOVE")}
            <span aria-hidden="true">○</span>
          </div>
          {copy()}
          <div className={styles.bronzeGrid}>
            <div>{details}</div>
            {art()}
          </div>
        </div>
      );
      break;
    case "pottery-studio-ninth-anniversary":
      composition = (
        <div className={styles.pottery}>
          <div className={styles.potteryWords}>
            {label("SHAPED BY THE YEARS")}
            {copy()}
            <p className={styles.handwritten}>a life, made together</p>
          </div>
          {art(styles.potteryPhoto)}
          <div className={styles.potteryFooter}>{details}</div>
        </div>
      );
      break;
    case "steel-skyline-eleventh-anniversary":
      composition = (
        <div className={styles.skyline}>
          <div className={styles.skylineImage}>
            {art()}
            <span className={styles.skylineLabel}>LOVE LIGHTS UP THE CITY</span>
          </div>
          <div className={styles.skylineWords}>
            {copy()}
            <div className={styles.skylineFooter}>{details}</div>
          </div>
        </div>
      );
      break;
    case "silk-moon-twelfth-anniversary":
      composition = (
        <div className={styles.moon}>
          {label("UNDER THE SAME MOON")}
          <div className={styles.moonPortrait}>{art()}</div>
          {copy(styles.center)}
          {details}
        </div>
      );
      break;
    case "lace-heirloom-thirteenth-anniversary":
      composition = (
        <div className={styles.lace}>
          <div className={styles.laceFrame}>
            {label("A LOVE TO KEEP FOREVER")}
            {copy(styles.center)}
            <div className={styles.laceSpread}>
              {art()}
              <div>{details}</div>
            </div>
          </div>
        </div>
      );
      break;
    case "ivory-orchid-fourteenth-anniversary":
      composition = (
        <div className={styles.orchid}>
          <div className={styles.orchidWords}>
            {label("SIMPLY, US")}
            {copy()}
            {details}
          </div>
          {art(styles.orchidPhoto)}
        </div>
      );
      break;
    case "sapphire-evening-anniversary":
      composition = (
        <div className={styles.sapphire}>
          {label("THE PLEASURE OF YOUR COMPANY")}
          {copy(styles.center)}
          <div className={styles.sapphirePicture}>{art()}</div>
          {details}
        </div>
      );
      break;
    case "emerald-conservatory-anniversary":
      composition = (
        <div className={styles.emerald}>
          <div className={styles.emeraldImage}>{art()}</div>
          <div className={styles.emeraldInvitation}>
            {label("LOVE IS AN EVERGREEN THING")}
            {copy()}
            <div className={styles.rule} />
            {details}
          </div>
        </div>
      );
      break;
    case "diamond-light-sixtieth-anniversary":
      composition = (
        <div className={styles.diamond}>
          <div className={styles.diamondTop}>
            {label("SIX DECADES. ONE EXTRAORDINARY LOVE.")}
            {copy()}
          </div>
          <div className={styles.diamondBottom}>
            {art()}
            <div>{details}</div>
          </div>
        </div>
      );
      break;
    case "hydrangea-house-anniversary":
      composition = (
        <div className={styles.hydrangea}>
          <div className={styles.hydrangeaHeader}>
            {label("THE HOME WE HAVE MADE")}
            {copy(styles.center)}
          </div>
          {art()}
          <div className={styles.hydrangeaFooter}>{details}</div>
        </div>
      );
      break;
    case "amalfi-postcard-anniversary":
      composition = (
        <div className={styles.amalfi}>
          <div className={styles.amalfiStripes} aria-hidden="true" />
          <div className={styles.amalfiSpread}>
            <div className={styles.amalfiPhoto}>
              {art()}
              <p>amore, sempre.</p>
            </div>
            <div className={styles.amalfiWords}>
              {label("A POSTCARD FROM OUR LOVE STORY")}
              {copy()}
              {details}
            </div>
          </div>
        </div>
      );
      break;
    case "stargazer-vows-anniversary":
      composition = (
        <div className={styles.stargazer}>
          <div className={styles.stargazerHeader}>
            {label("OUR PLACE IN THE UNIVERSE")}
            <span aria-hidden="true">✦ · ✧</span>
          </div>
          {art(styles.stargazerPhoto)}
          <div className={styles.stargazerWords}>
            {copy()}
            {details}
          </div>
        </div>
      );
      break;
    case "vinyl-love-song-anniversary":
      composition = (
        <div className={styles.vinyl}>
          <div className={styles.vinylTop}>
            {label("STILL OUR FAVORITE LOVE SONG")}
            <span aria-hidden="true">33⅓ · FOREVER</span>
          </div>
          <div className={styles.vinylSleeve}>
            {art()}
            <div>
              {copy()}
              <div className={styles.vinylTrack}>{details}</div>
            </div>
          </div>
        </div>
      );
      break;
    case "desert-sunrise-anniversary":
      composition = (
        <div className={styles.desert}>
          <div className={styles.desertHeading}>
            {label("THE BEAUTY OF ANOTHER DAY")}
            {copy()}
          </div>
          <div className={styles.desertLandscape}>
            {art()}
            <div className={styles.desertCard}>{details}</div>
          </div>
        </div>
      );
      break;
    case "champagne-midnight-anniversary":
      composition = (
        <div className={styles.champagne}>
          <div className={styles.champagneHeading}>
            {label("GOOD COMPANY. GREAT LOVE.")}
            {copy(styles.center)}
          </div>
          <div className={styles.champagnePhoto}>
            {art()}
            <span aria-hidden="true">✦</span>
          </div>
          <div className={styles.champagneFooter}>
            {facts}
            {rsvp}
          </div>
        </div>
      );
      break;
    default:
      return null;
  }

  return (
    <section
      className={styles.scene}
      data-birthday-scene={theme.id}
      style={
        {
          "--anniversary-paper": theme.colors.primary,
          "--anniversary-ink": theme.colors.secondary,
          background: theme.colors.primary,
          color: theme.colors.secondary,
          fontFamily: '"Inter", sans-serif',
        } as CSSProperties
      }
    >
      {composition}
    </section>
  );
}
