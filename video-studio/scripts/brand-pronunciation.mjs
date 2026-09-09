/** Pronunciation follows ../../ENVITEFY_BRAND.md and the user's supplied audio. */
export const ENVITEFY_SPOKEN_NAME = "in-VY-tih-fy";
export const ENVITEFY_IPA = "ɪnˈvaɪtɪfaɪ";
export const ENVITEFY_CMU_PHONEMES = "IH0 N V AY1 T IH0 F AY0";
export const ENVITEFY_IPA_SSML = '<phoneme alphabet="ipa" ph="ɪnˈvaɪtɪfaɪ">Envitefy</phoneme>';
// These are requested controls, not proof of the generated sound; compare audio to the reference.
export const ENVITEFY_SSML = '<phoneme alphabet="cmu-arpabet" ph="IH0 N V AY1 T IH0 F AY0">Envitefy</phoneme>';
export const ENVITEFY_PRONUNCIATION_NOTE = "The company name Envitefy must match the user-supplied pronunciation recording: approximately /ɪnˈvaɪtɪfaɪ/, in-VY-tih-fy. Say it naturally as one continuous four-syllable word. Use a short initial in, stress VY to rhyme with eye, follow it with a short unstressed tih, and end with fy rhyming with fly. Preserve the short vowel heard between VY and fy. Do not infer pronunciation from spelling. Keep all visible text spelled exactly Envitefy; phonetic spelling and IPA are internal pronunciation metadata only.";
export function toDisplayText(text) {
  return text.replace(/<phoneme\b[^>]*>En<\/phoneme>\s*<phoneme\b[^>]*>vite<\/phoneme>\s*<phoneme\b[^>]*>fy<\/phoneme>/gi, "Envitefy")
    .replace(/<phoneme\b[^>]*>Envitefy<\/phoneme>/gi, "Envitefy")
    .replace(/@eh[012]@n@v@ay[012]@t@f@ay[012]/gi, "Envitefy")
    .replace(/@ih0@n@v@ay[012]@t@i[hy][01]@f@ay[012]/gi, "Envitefy")
    .replace(/"?\/(?:ɪnˈvaɪtɪfaɪ|ɛnˈvaɪtfaɪ|ɪnˌvaɪˈtiːfaɪ|ɪnˈvaɪtiːfaɪ|ɪnˈvaɪtiˌfaɪ)\/"?/g, "Envitefy")
    .replace(/\ben[-‐‑– ]vite[-‐‑– ]fy\b/gi, "Envitefy")
    .replace(/\bin[-‐‑– ]?vy[-‐‑– ]?(?:tee|tih)[-‐‑– ]?fy\b/gi, "Envitefy")
    .replace(/\binvitee[-‐‑– ]?fy\b/gi, "Envitefy");
}
export function resolveSpeechModel(text, modelId = "eleven_flash_v2") {
  if (!/\benvitefy\b/i.test(toDisplayText(text))) return modelId;
  return modelId === "eleven_v3" ? modelId : "eleven_flash_v2";
}
export const speechModelForText = resolveSpeechModel;
export function toSpeechText(text, modelId = "eleven_flash_v2") {
  const canonical = toDisplayText(text);
  if (!/\benvitefy\b/i.test(canonical)) return text;
  const spoken = resolveSpeechModel(canonical, modelId) === "eleven_v3" ? '"/' + ENVITEFY_IPA + '/"' : ENVITEFY_SSML;
  return canonical.replace(/\benvitefy\b/gi, spoken);
}
export function withBrandPronunciationDirection(prompt) {
  if (!/\b(?:envitefy|inviteefy)\b/i.test(toDisplayText(prompt)) || prompt.includes(ENVITEFY_PRONUNCIATION_NOTE)) return prompt;
  return prompt + "\n\n" + ENVITEFY_PRONUNCIATION_NOTE + " This controls pronunciation only: do not add dialogue or change on-screen text.";
}
