/** Keep each sport's equipment and composition specific to its event. */
export function sportsArtworkScene(sport: string, variation = 0, composition: "venue" | "town" = "venue"): string {
  if (/gymnastics|balance beam/i.test(sport)) {
    const lighting = [
      "soft late-afternoon light with restrained warm highlights",
      "clear morning light with gentle architectural shadows",
      "quiet blue-hour light with a softly illuminated entrance",
    ];
    const subject = composition === "town"
      ? "Gymnastics host-town illustration: make the explicitly supplied host town's streetscape and local landscape the dominant subject, approximately 85 percent of the visual emphasis. Use a cohesive town view with restrained, confidently known local character. Do not invent distinctive buildings or landmarks when their appearance is uncertain. This is a town illustration, not a verified depiction of the meet venue."
      : "Gymnastics venue illustration: make the actual meet venue the dominant subject, approximately 85 percent of the visual emphasis, using the supplied verified exterior reference. Preserve its recognizable building silhouette, facade and entrance.";
    return `${subject} Use ${lighting[Math.abs(Math.trunc(variation)) % lighting.length]}. Place one small, coherent still life of leather gymnastics grips and a chalk bag at a lower edge, leaving the setting unobstructed. Add two delicate sweeping graphic motion lines in the event palette, integrated into the margins. These lines are abstract decoration, not rhythmic-gymnastics ribbon apparatus. Accessories and motion lines together carry about 15 percent of the emphasis. No gymnast, athlete, person, human silhouette, human-shaped shadow or body part. No skyline collage, unrelated landmark, giant equipment or invented competition setup. This is an original editorial illustration, not a photograph of the real meet.`;
  }
  if (/basketball|volleyball|tennis|badminton|pickleball/i.test(sport))
    return "Court sport: one adult athlete preparing to play, with both shoes visibly grounded on the court. Use only equipment and court markings belonging to the supplied sport; keep racket grips, ball size, net placement and limb proportions credible. Avoid airborne action, merged equipment or contradictory courts.";
  if (/swim|water polo|diving/i.test(sport))
    return "Aquatic sport: an authentic indoor pool with coherent lane ropes and starting blocks. Prefer an equipment-centered scene; any adult athlete is standing naturally on the pool deck with visible ground contact. Do not combine a running track, court or gym apparatus with the pool, or show anatomically ambiguous underwater action.";
  if (/cycling|bik(?:e|ing)/i.test(sport))
    return "Cycling: a credible bicycle beside a grounded adult rider, with two coherent wheels, a connected frame, correctly attached pedals and handlebars. Avoid complex racing action or limbs passing through the bicycle.";
  if (/football|soccer|rugby|baseball|softball|hockey/i.test(sport))
    return "Field or rink sport: an adult athlete in a simple grounded pregame stance with visible foot contact. Match the ball or puck, protective equipment, playing surface and goals to the supplied sport; do not mix American football, soccer, baseball or hockey equipment. Avoid airborne tackles or tangled bodies.";
  if (/run|track|athletics|marathon/i.test(sport))
    return "Running: one adult athlete preparing at a track or road start, both shoes planted naturally on the same surface, with anatomically coherent limbs. Track lanes must follow a consistent perspective. Avoid impossible running poses or floating feet.";
  return "Represent the supplied sport with one simple, physically credible preparation pose or an equipment-centered scene. Match the equipment to the actual sport. Make support, grip and contact points visible, use coherent perspective and normal anatomy, and avoid complex airborne action. If an accurate pose cannot be represented clearly, choose authentic equipment without people.";
}

/** Geography disambiguates the actual venue; it never supplies a substitute landmark. */
export function sportsArtworkSetting(sport: string, city: string, composition: "venue" | "town" = "venue"): string {
  if (!/gymnastics|balance beam/i.test(sport)) return "";
  if (composition === "town") return "Gymnastics town fallback: use only the explicitly supplied host town from the event city/address. Never substitute a better-known nearby city, infer a location from the meet or organizer name, or imply that a town landmark is the meet venue. Keep the town environment visible in the central portrait crop, with subtle gymnastics accessories at the margins. The venue could not be referenced, so do not fabricate its exterior.";
  return "Gymnastics location direction: use the supplied venue identity and verified exterior reference as the architectural subject. City and address only disambiguate that venue. Never substitute a better-known nearby city, skyline, tourist attraction or a location inferred from the meet name. Retain only landscaping visible in the reference; do not invent local landmarks. If the venue cannot be verified, do not invent its appearance.";
}

export const SPORTS_REPRESENTATION_RULE =
  "Location describes scenery only. Never infer or select an athlete's race, ethnicity, skin tone, nationality or cultural clothing from a city, venue, event name, source website or palette. Unspecified demographics must remain independent of geography; no racial group is required or excluded. Do not infer demographic traits from the sport either. These are fictional adults, not portraits of actual participants.";
