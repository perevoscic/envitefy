import type { ReactNode } from "react";
import { BIRTHDAY_BODY_DIRECTIONS } from "./body-directions";
import styles from "./birthday-scenes.module.css";

type Props = { id: string; blocks: Record<string, ReactNode> };
export default function BirthdayArtDirectedBody({ id, blocks }: Props) {
  const treatment = BIRTHDAY_BODY_DIRECTIONS[id];
  const { story, notes, gallery, hosts, schedule, registry, rsvp } = blocks;
  const end = <div className={styles.response}>{registry}{rsvp}</div>;
  const memory = <div className={styles.memory}>{gallery}</div>;
  let content: ReactNode;
  switch (treatment) {
    case "confetti": content = <><div className={styles.confettiSpread}><div>{story}{hosts}</div><div>{notes}{schedule}</div></div>{memory}{end}</>; break;
    case "confection": content = <><div className={styles.confectionMenu}>{story}<div>{notes}{hosts}</div></div>{memory}<div className={styles.scallopBand}>{schedule}{end}</div></>; break;
    case "festival": content = <><div className={styles.festivalBill}>{story}{schedule}</div><div className={styles.festivalColumns}>{notes}{hosts}</div>{memory}{end}</>; break;
    case "journal": content = <><div className={styles.journalSpread}><div>{story}{hosts}</div><div>{notes}{schedule}</div></div>{memory}{end}</>; break;
    case "specimen": content = <><div className={styles.specimenGrid}><div>{story}</div><aside>{notes}</aside><div>{schedule}{hosts}</div></div>{memory}{end}</>; break;
    case "menu": content = <><div className={styles.menuPage}><div>{hosts}</div><div>{story}{notes}{schedule}</div></div>{memory}{end}</>; break;
    case "mission": content = <><div className={styles.missionPanel}><div>{story}</div><div>{schedule}{hosts}</div><aside>{notes}</aside></div>{memory}{end}</>; break;
    case "stage": content = <><div className={styles.stageProgram}>{story}<div>{hosts}{schedule}</div></div>{memory}<div className={styles.programNotes}>{notes}</div>{end}</>; break;
    case "storybook": content = <><div className={styles.storybookPage}>{story}</div><div className={styles.storybookSpread}>{notes}{hosts}</div>{memory}{schedule}{end}</>; break;
    case "coast": content = <><div className={styles.coastalLetter}>{story}{hosts}</div>{memory}<div className={styles.coastalDetails}>{notes}{schedule}</div>{end}</>; break;
    case "club": content = <><div className={styles.clubLineup}>{story}{schedule}</div>{memory}<div className={styles.clubInfo}>{notes}{hosts}</div>{end}</>; break;
    case "scorecard": content = <><div className={styles.scoreProgram}><div>{story}</div><aside>{notes}</aside><div>{schedule}{hosts}</div></div>{memory}{end}</>; break;
    case "atelier": content = <><div className={styles.atelierWall}><div>{story}{hosts}</div><div>{gallery}</div><div>{notes}{schedule}</div></div>{end}</>; break;
    case "dispatch": content = <><div className={styles.dispatchFront}>{story}<aside>{hosts}{schedule}</aside></div><div className={styles.dispatchNotes}>{notes}</div>{memory}{end}</>; break;
    case "garden": content = <><div className={styles.gardenWalk}>{story}<div>{notes}</div>{hosts}</div>{memory}{schedule}{end}</>; break;
    case "archive": content = <><div className={styles.archiveColumns}>{story}<aside>{hosts}{notes}</aside></div>{memory}<div className={styles.archiveFoot}>{schedule}{end}</div></>; break;
    case "banquet": content = <><div className={styles.banquetInvitation}>{story}{hosts}</div><div className={styles.banquetPlacecards}>{notes}{schedule}</div>{memory}{end}</>; break;
    case "gallery": content = <><div className={styles.galleryIntro}>{story}<aside>{hosts}</aside></div>{memory}<div className={styles.galleryLabels}>{notes}{schedule}</div>{end}</>; break;
    case "lounge": content = <><div className={styles.loungeSleeve}>{story}<div>{hosts}{notes}</div></div>{memory}{schedule}{end}</>; break;
    case "voyage": content = <><div className={styles.voyageLog}><div>{story}{schedule}</div><aside>{notes}{hosts}</aside></div>{memory}{end}</>; break;
    case "workshop": content = <><div className={styles.workshopSheet}>{story}<div>{notes}</div><aside>{hosts}{schedule}</aside></div>{memory}{end}</>; break;
    case "market": content = <><div className={styles.marketStalls}>{story}{notes}<div>{hosts}{schedule}</div></div>{memory}{end}</>; break;
    case "dunes": content = <><div className={styles.dunesLetter}>{story}{hosts}</div>{memory}<div className={styles.dunesNotes}>{notes}{schedule}</div>{end}</>; break;
    case "salon": content = <><div className={styles.salonSuite}>{story}<div>{notes}{hosts}</div></div>{memory}{schedule}{end}</>; break;
    default: content = <>{story}{notes}{memory}{hosts}{schedule}{end}</>;
  }
  return <div className={`${styles.body} ${styles[treatment] || ""}`} data-birthday-art-body={id} data-birthday-body-treatment={treatment}>{content}</div>;
}
