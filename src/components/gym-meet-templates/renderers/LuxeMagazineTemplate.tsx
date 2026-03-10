/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import ShowcaseGymMeetTemplate from "./ShowcaseGymMeetTemplate";
import { SHOWCASE_THEMES } from "../showcaseThemes";

export default function LuxeMagazineTemplate(props: any) {
  return <ShowcaseGymMeetTemplate {...props} theme={SHOWCASE_THEMES["luxe-magazine"]} />;
}
