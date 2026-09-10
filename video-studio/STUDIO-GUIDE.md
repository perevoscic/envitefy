# Envitefy video preferences

Saved from the user's production decisions on September 5, 2026. These are defaults for future Envitefy videos; a specific request can override them.

## Brand and product

- Use the exact supplied transparent PNG wordmark: parent public/brand/envitefy-com.png. Studio copy: public/brand/envitefy-com.png. This supplied asset already reads envitefy.com; preserve its alpha transparency. It supersedes the earlier email wordmark for new videos and requested revisions.
- Persistent branding (September 10, 2026): show the official wordmark as a separate editing overlay in the upper-left from frame zero until the final three seconds. Preserve exact lettering, colors, transparency and proportions; keep it small but clearly readable and static, without bouncing, flashing or distracting animation. Set position and size independently for 16:9 and 9:16, leaving comfortable margins and checking platform interface overlays, faces, captions and important phone-screen details. Use a subtle background backing when contrast is poor; never modify the wordmark to compensate.
- Final three seconds (September 10, 2026): remove the corner wordmark and show a larger centered official wordmark, followed by “The right details. The right celebration.” and “Envitefy.com”. Never show the corner and end-card logos simultaneously. The explicit separate domain line on this end card supersedes the earlier no-duplicate-domain preference; keep it in the campaign's supporting text color.
- Use the exact chosen icon: parent `public/icons/apple-touch-icon-120.png`. Studio copy: `public/brand/apple-touch-icon-120.png`.
- Preserve the assets' colors, artwork, transparency, and proportions. Resize to suit the composition; do not redraw the wordmark with a substitute font.
- Use `envitefy.com` for the brand CTA. Product references in ordinary copy may say Envitefy; the supplied visual wordmark remains lowercase.
- Show actual working product screens for feature demonstrations. Confirm claims against the parent app's marketing catalog and the demonstrated event type.
- Under a live-card demo, explain the action in plain language and synchronize the caption with the visible state. The established examples are “RSVP on the spot,” “Directions, one tap away,” and “Add it to your calendar.” Adapt the wording to the actual interaction.
- The demo label is **Envitefy Live Card Demo**. Avoid placeholder domains such as example.com in final branded demo footage. Use a suitable Envitefy demo contact; do not imply a sample contact is a provisioned mailbox.

## Creative direction

- Give each new video a fresh look: new fictional people, setting, wardrobe, composition, and story treatment where people are used. Keep identity and setting consistent within that video's connected scenes.
- The user does not want a digital twin of themselves or a fixed HeyGen-style personal presenter. Do not reuse the Host Mode woman as a permanent spokesperson.
- Build a strong opening, a concrete relatable situation, a readable product moment, and an ending that earns its CTA. Choose the structure and pacing for the request; the 22-second Host Mode cut is a precedent, not a fixed template.
- The tone can be funny, warm, candid, or educational as requested. Favor specific human situations over generic sales narration. Busy parents are one audience, not the audience for every campaign.
- Do not add the previously rejected decorative “AI-generated visuals and narration” footer. This visual preference does not decide any disclosure requirements of a later publishing destination.

## Audio

- Standing pronunciation (September 9, 2026, user audio reference): match the supplied recording, approximately **in-VY-tih-fy**, **/ɪnˈvaɪtɪfaɪ/**, four connected syllables with primary stress on VY. Preserve the short unstressed tih sound. The recording supersedes the earlier written three-syllable en-VITE-fy approximation. Read [ENVITEFY_BRAND.md](../ENVITEFY_BRAND.md) for the audio reference and complete model direction; use `scripts/brand-pronunciation.mjs` for internal speech controls and caption normalization. Compare generated audio with the recording. Visible branding remains Envitefy.
- Pronunciation approval (September 9, 2026): the user confirmed the current audio is perfect. Preserve the approved take for unchanged lines. Durable references, file hashes, and the approval are in [assets/brand/audio/pronunciation.json](assets/brand/audio/pronunciation.json); this audio takes precedence over earlier written approximations.
- The user rejected narration that obviously sounds synthetic. Natural delivery matters more than using a particular provider.
- Narration is optional, not prohibited. Choose spoken narration, dialogue, music, ambience, and sound effects to serve the story; do not restrict a requested longer video to the old short script.
- For speech, the existing ElevenLabs narration pipeline is available. Audition a short sample and adjust voice, writing, timing, and delivery before generating the full track when a new voice is needed. Do not default to the old Intro voice simply because it is configured.
- For the established Host Mode style, original music, ambient party sound, and timed notification effects worked without scripted narration. Google Lyria supplied that instrumental. Provider availability and account access are operational facts to check when needed, not permanent creative limits.
- Preserve intelligibility, natural pauses, and clean transitions. Match captions to actual speech when speech is used; never cut a spoken sentence merely to hit an arbitrary target duration.

## Formats and delivery

- Keep each video's exports and supporting output files in a separate `out/<campaign>/` folder. Revisions, alternate aspect ratios, intermediate renders, thumbnails, and review images belong with their original video. Do not mix different videos in the top-level `out/` folder. Briefs remain in `projects/<campaign>/`, and source assets remain in `public/projects/<campaign>/`.
- Honor the requested platform, duration, and aspect ratio. Working defaults: vertical 1080 × 1920 for TikTok/Reels/Shorts; 1080 × 1080 when square/1:1 is requested; horizontal 1920 × 1080 for a standard landscape video. Use 30 fps unless the brief calls for something else.
- “Instagram” alone does not permanently mean square. Infer from the user's context or clarify feed versus Reel when it changes the work. The Host Mode Instagram adaptation was explicitly requested in 1:1.
- Re-layout text, cards, CTA, and shot framing for each format. Inspect each export; a center crop alone may hide faces, hand actions, or card controls.
- Review the actual first frames and cuts, not only contact-sheet samples. Prior problems included a one-frame kitchen mismatch and two hands placing the same bowl.
- Deliver a locally playable MP4, a direct file link, and a concise description of the change. Add captions, thumbnails, or platform copy when requested or needed for that deliverable.

## Social post copy

- Standing preference (September 9, 2026): include the most popular relevant tags and hashtags when generating posts for each requested platform. Check current popularity when drafting; tailor the tags to the post’s topic, audience, and platform. Describe a tag as “most popular” or “trending” only when current evidence supports it, and use platform-appropriate formatting.

## Storage and Git

- Standing preference (September 10, 2026): keep the studio's reusable knowledge on GitHub: README, project rules, this preferences guide, producer skill and workflow reference, blank campaign brief, written pronunciation reference, and ignore rules. Generated videos, images, audio recordings, campaign records, production source code, and scripts stay local and ignored. Keep the entire studio out of application container uploads. This supersedes the earlier skill-only tracking rule. Preserve older Git history; the user requested cleanup of the current branch only.

## Keeping preferences current

When feedback describes a lasting preference, update the relevant section above in the same task and add a short dated entry below. Keep one current statement per preference. Preserve scene-specific requests in the relevant campaign's feedback record.

Preference history:
- 2026-09-10: Added persistent static upper-left official branding, independent landscape/portrait placements with interface and content clearance, subtle contrast backing, and an exclusive final three-second centered brand card with the exact new tagline and Envitefy.com.
- 2026-09-10: User clarified that GitHub should retain the studio's reusable guidance and skills while generated media and local production files remain ignored.
- 2026-09-09: User requested popular tags/hashtags with all future generated post copy; check current popularity and relevance for each platform.
- 2026-09-09: User supplied envitefy.wav as the pronunciation reference. Direct comparison identifies in-VY-tih-fy, approximately /ɪnˈvaɪtɪfaɪ/. Both videos were matched to it; the audio reference supersedes the previous written three-syllable approximation.
- 2026-09-09: Reconciled stale brand/producer skill text and speech controls with the mandatory en-VITE-fy standard; both John Space Disco formats revised together. Earlier four-syllable decisions remain archived in campaign revision notes only.
- 2026-09-08: Saved the mandatory brand spelling and pronunciation standard in the parent ENVITEFY_BRAND.md and required explicit generation instructions and pronunciation review. The final en-VITE-fy clarification supersedes the earlier EN-vite-ih-fy wording. At the user's request, the pronunciation standard uses written guidance only.
- 2026-09-05: User requested a separate output folder for each video after reviewing the mixed export folder. Applied to existing outputs and future Studio/CLI renders.
- 2026-09-05: Captured exact branding, fresh casts and settings, no personal twin, natural audio with optional narration, real product demonstrations, action captions, demo naming, and format-specific layouts from the original production task.

- 2026-09-05: User replaced the studio wordmark with public/brand/envitefy-com.png. The supplied wordmark already contains the domain; retain its transparent background and avoid a duplicate black domain line. Scene layout choices are recorded in the campaign feedback.
