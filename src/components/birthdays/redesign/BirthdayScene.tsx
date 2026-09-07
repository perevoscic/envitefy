import Next26BirthdayScenes from "./Next26BirthdayScenes";
import { NEXT26_BIRTHDAY_IDS } from "@/data/birthday-next26-designs";
import "./birthday-fonts.css";
import OriginalBirthdayScenes from "./OriginalBirthdayScenes";
import KidsBirthdayScenes from "./KidsBirthdayScenes";
import AdultBirthdayScenes from "./AdultBirthdayScenes";
import AnniversaryScenes from "./AnniversaryScenes";
import { ANNIVERSARY_COLLECTION_BY_ID } from "@/data/anniversary-template-data";
import { BIRTHDAY_ORIGINAL_ART } from "@/data/birthday-original-art";
import { BIRTHDAY_KIDS_ART } from "@/data/birthday-kids-art";
import { BIRTHDAY_ADULT_ART } from "@/data/birthday-adult-art";
import type { BirthdaySceneProps } from "./types";

export function hasBirthdayScene(id: string) {
  return Boolean(NEXT26_BIRTHDAY_IDS.has(id) || BIRTHDAY_ORIGINAL_ART[id] || BIRTHDAY_KIDS_ART[id] || BIRTHDAY_ADULT_ART[id] || ANNIVERSARY_COLLECTION_BY_ID.has(id));
}

export default function BirthdayScene(props: BirthdaySceneProps) {
  const id = props.theme.id;
  return <div className="relative isolate" style={{ containerType: "inline-size" }} data-birthday-design-version="atelier-2026">
    {props.actions ? <div className="relative z-30 flex justify-end px-5 py-3">{props.actions}</div> : null}
    {NEXT26_BIRTHDAY_IDS.has(id) ? <Next26BirthdayScenes {...props} /> : ANNIVERSARY_COLLECTION_BY_ID.has(id) ? <AnniversaryScenes {...props} /> : BIRTHDAY_ORIGINAL_ART[id] ? <OriginalBirthdayScenes {...props} /> : BIRTHDAY_KIDS_ART[id] ? <KidsBirthdayScenes {...props} /> : <AdultBirthdayScenes {...props} />}
  </div>;
}
