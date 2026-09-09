/** Canonical spoken form; written branding remains Envitefy. */
export const ENVITEFY_SPOKEN_NAME = "Inviteefy";
export const ENVITEFY_IPA = "ɪnˈvaɪtiˌfaɪ";
export const ENVITEFY_SSML = '<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>';
export const ENVITEFY_CMU_PHONEMES = "IH0 N V AY1 T IY0 F AY2";
export const ENVITEFY_PRONUNCIATION_NOTE = 'Spoken Envitefy is Inviteefy, IPA /ɪnˈvaɪtiˌfaɪ/: one continuous word, primary stress on VY, secondary stress on fy. Use the exact IPA; keep Envitefy in written copy, captions, URLs and artwork.';
export function toDisplayText(text) {
  return text.replace(/<phoneme\b[^>]*>Envitefy<\/phoneme>/gi, "Envitefy")
    .replace(/@ih0@n@v@ay[012]@t@iy[01]@f@ay[02]/gi, "Envitefy")
    .replace(/"?\/(?:ɪnˌvaɪˈtiːfaɪ|ɪnˈvaɪtiːfaɪ|ɪnˈvaɪtiˌfaɪ)\/"?/g, "Envitefy")
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
