/** Deliberately simple scenes make support, anatomy and equipment easy to inspect. */
export function sportsArtworkScene(sport: string): string {
  if (/gymnastics|balance beam/i.test(sport))
    return "Gymnastics: one adult gymnast in a simple upright balance on a balance beam inside a gymnastics hall, both bare feet placed lengthwise on the beam's visible top surface, one behind the other. Show the complete feet, their contact with the beam, the beam supports and safety mats. Keep the torso over the supporting feet, with natural joints and relaxed outstretched arms. No crossed-leg pose, floating support foot, midair trick, impossible contortion or beam passing through the body.";
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

export const SPORTS_REPRESENTATION_RULE =
  "Location describes scenery only. Never infer or select an athlete's race, ethnicity, skin tone, nationality or cultural clothing from a city, venue, event name, source website or palette. Unspecified demographics must remain independent of geography; no racial group is required or excluded. Do not infer demographic traits from the sport either. These are fictional adults, not portraits of actual participants.";
