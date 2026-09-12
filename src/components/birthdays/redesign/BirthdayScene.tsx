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
  const sceneProps = { ...props, actions: undefined };
  return <div className="relative isolate" style={{ containerType: "inline-size" }} data-birthday-design-version="atelier-2026">
    {props.actions ? <div className="pointer-events-none absolute inset-x-5 top-3 z-30 flex justify-end [&>*]:pointer-events-auto">{props.actions}</div> : null}
    {NEXT26_BIRTHDAY_IDS.has(id) ? <Next26BirthdayScenes {...sceneProps} /> : ANNIVERSARY_COLLECTION_BY_ID.has(id) ? <AnniversaryScenes {...sceneProps} /> : BIRTHDAY_ORIGINAL_ART[id] ? <OriginalBirthdayScenes {...sceneProps} /> : BIRTHDAY_KIDS_ART[id] ? <KidsBirthdayScenes {...sceneProps} /> : <AdultBirthdayScenes {...sceneProps} />}
  </div>;
}
