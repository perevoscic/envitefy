/** Spoken guidance from ../../ENVITEFY_BRAND.md; visible branding remains Envitefy. */
export const ENVITEFY_SPOKEN_NAME = "en-VITE-fy";
export const ENVITEFY_IPA = "ɛnˈvaɪtfaɪ";
export const ENVITEFY_CMU_PHONEMES = "EH1 N V AY1 T F AY0";
export const ENVITEFY_IPA_SSML = '<phoneme alphabet="ipa" ph="ɛnˈvaɪtfaɪ">Envitefy</phoneme>';
// Requested TTS controls only; they do not prove acoustic correctness.
// John's validated production method uses an exact-IPA local reference and voice conversion.
export const ENVITEFY_SSML = '<phoneme alphabet="cmu-arpabet" ph="EH1 N">En</phoneme><phoneme alphabet="cmu-arpabet" ph="V AY1 T">vite</phoneme><phoneme alphabet="cmu-arpabet" ph="F AY0">fy</phoneme>';
export const ENVITEFY_PRONUNCIATION_NOTE = 'The company name Envitefy must be pronounced en-VITE-fy, approximately /ɛnˈvaɪtfaɪ/. Do not infer its pronunciation from its spelling. Say it naturally as one continuous word. Use the short “en” in “enter,” stress “VITE” to rhyme with “bite,” and end with “fy” rhyming with “fly.” Do not pause between syllables or insert an extra syllable. Keep all visible text spelled exactly “Envitefy”; pronunciation guidance is internal metadata only.';
export function toDisplayText(text) {
  return text.replace(/<phoneme\b[^>]*>En<\/phoneme>\s*<phoneme\b[^>]*>vite<\/phoneme>\s*<phoneme\b[^>]*>fy<\/phoneme>/gi, "Envitefy")
    .replace(/<phoneme\b[^>]*>Envitefy<\/phoneme>/gi, "Envitefy")
    .replace(/@eh[012]@n@v@ay[012]@t@f@ay[012]/gi, "Envitefy")
    .replace(/@ih0@n@v@ay[012]@t@iy[01]@f@ay[02]/gi, "Envitefy")
    .replace(/"?\/(?:ɛnˈvaɪtfaɪ|ɪnˌvaɪˈtiːfaɪ|ɪnˈvaɪtiːfaɪ|ɪnˈvaɪtiˌfaɪ)\/"?/g, "Envitefy")
    .replace(/\ben[-‐‑– ]vite[-‐‑– ]fy\b/gi, "Envitefy")
    .replace(/\bin[-‐‑– ]?vy[-‐‑– ]?tee[-‐‑– ]?fy\b/gi, "Envitefy")
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
  if (!/\b(?:envitefy|inviteefy)\b/i.test(prompt) || prompt.includes(ENVITEFY_PRONUNCIATION_NOTE)) return prompt;
  return prompt + "\n\n" + ENVITEFY_PRONUNCIATION_NOTE + " This controls pronunciation only: do not add dialogue or change on-screen text.";
}
