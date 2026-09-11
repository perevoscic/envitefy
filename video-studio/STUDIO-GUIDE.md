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
- Demo pacing (September 11, 2026, future videos): slow down product walkthroughs so viewers can follow each screen and action on a first watch. Establish the screen before clicking, demonstrate one action at a time, and hold the resulting panel long enough to read its key content and finish the matching narration/caption, with a brief pause before moving on. Set dwell time from the actual content and speech; avoid rapid screen changes or sped-up interactions. Allow more runtime for the demo when flexible; when duration is fixed, show fewer steps instead of rushing them.
- Live Card narration alignment (September 11, 2026): every demonstrated action, including Overview, needs a matching spoken explanation while its actual panel is open. Check both directions: narration must match the visible action, and an opened action must not be left unexplained.
- Live Card framing preference (September 11, 2026): demonstrate each button on one stationary card. Keep its artwork, card position, size and crop fixed while the actual action panels open and close. Show deliberate clicks and keep the bottom action buttons inside the artwork visible; avoid zooming, panning or swapping to differently framed card shots during the walkthrough.
- Live Card demonstration preference (September 10, 2026): open each actual action panel when it is named and show the action and result while explaining it. Merely highlighting closed buttons is insufficient. Keep controls and labels high contrast against the artwork.
- Under a live-card demo, explain the action in plain language and synchronize the caption with the visible state. The established examples are “RSVP on the spot,” “Directions, one tap away,” and “Add it to your calendar.” Adapt the wording to the actual interaction.
- The demo label is **Envitefy Live Card Demo**. Avoid placeholder domains such as example.com in final branded demo footage. Use a suitable Envitefy demo contact; do not imply a sample contact is a provisioned mailbox.

## Creative direction

- Ad creative workflow (September 11, 2026): use [Envitefy Ad Creative](.agents/skills/envitefy-ad-creative/SKILL.md) for new campaign ideas and substantial story revisions. Develop distinct concepts where direction is open, critique them, and hand the selected script/storyboard and visual direction to the producer through the existing brief. Save alternatives and rationale in campaign creative-development notes; simple production edits reuse the saved plan. Written ideas and copy can be requested on their own.

- Standing image-model preference (September 10, 2026): use **`gpt-image-2.5-flare`** for newly generated video artwork, storyboards, cast/reference frames, and image edits. The user's “imagine-2.5-flare” refers to this exact API model, already used in the Mom, Just Snap It campaign. Select it explicitly and record the actual model in provenance; do not silently fall back to another image model. This applies to the still-image stage. Reuse previously selected assets when the requested revision does not change them.

- Give each new video a fresh look: new fictional people, setting, wardrobe, composition, and story treatment where people are used. Keep identity and setting consistent within that video's connected scenes.
- The user does not want a digital twin of themselves or a fixed HeyGen-style personal presenter. Do not reuse the Host Mode woman as a permanent spokesperson.
- Build a strong opening, a concrete relatable situation, a readable product moment, and an ending that earns its CTA. Choose the structure and pacing for the request; the 22-second Host Mode cut is a precedent, not a fixed template.
- The tone can be funny, warm, candid, or educational as requested. Favor specific human situations over generic sales narration. Busy parents are one audience, not the audience for every campaign.
- Do not add the previously rejected decorative “AI-generated visuals and narration” footer. This visual preference does not decide any disclosure requirements of a later publishing destination.

## Audio

- Standing pronunciation (September 9, 2026, user audio reference): match the supplied recording, approximately **in-VY-tih-fy**, **/ɪnˈvaɪtɪfaɪ/**, four connected syllables with primary stress on VY. Preserve the short unstressed tih sound. The recording supersedes the earlier written three-syllable en-VITE-fy approximation. Read [ENVITEFY_BRAND.md](../ENVITEFY_BRAND.md) for the audio reference and complete model direction; use `scripts/brand-pronunciation.mjs` for internal speech controls and caption normalization. Compare generated audio with the recording. Visible branding remains Envitefy.
- Pronunciation approval (September 9, 2026): the user confirmed the current audio is perfect. Preserve the approved take for unchanged lines. Durable references, file hashes, and the approval are in [assets/brand/audio/pronunciation.json](assets/brand/audio/pronunciation.json); this audio takes precedence over earlier written approximations.
- The user rejected narration that obviously sounds synthetic. Natural delivery matters more than using a particular provider. Use a polished, conversational advertising read with natural pauses; extend the edit when needed instead of rushing or speeding up narration (reaffirmed September 10, 2026).
- Narration is optional, not prohibited. Choose spoken narration, dialogue, music, ambience, and sound effects to serve the story; do not restrict a requested longer video to the old short script.
- For speech, the existing ElevenLabs narration pipeline is available. Audition a short sample and adjust voice, writing, timing, and delivery before generating the full track when a new voice is needed. Do not default to the old Intro voice simply because it is configured.
- For the established Host Mode style, original music, ambient party sound, and timed notification effects worked without scripted narration. Google Lyria supplied that instrumental. Provider availability and account access are operational facts to check when needed, not permanent creative limits.
- Initialisms such as RSVP should flow naturally without exaggerated pauses between letters (September 11, 2026); keep the surrounding explanation conversational.
- Preserve intelligibility, natural pauses, and clean transitions. Match captions to actual speech when speech is used; never cut a spoken sentence merely to hit an arbitrary target duration.

## Quality standard for future videos

Standing preference (September 11, 2026, clarified): the user reviews the finished videos; Codex handles all preparation and quality work in the background during each requested production task. The next three new videos form the initial quality pilot. Past campaigns are unchanged unless a revision is requested.

- Develop and review the concept/script/storyboard internally before expensive generation. Record audience, problem, one main promise, opening, actual product proof, CTA and reference qualities. Choose routine details from the brief and preferences; do not require intermediate user signoff.
- Inspect selected moving shots and audio before assembly. Repair, simplify, replace or remove weak material; preserve natural speech and exact branding.
- Use a separate review subagent for independent rough-cut critique and final repair verification. The producer handles changes. Record actual media inspection methods, coverage, timestamped findings and evidence; an AI review never represents human approval.
- Complete technical checks, motion/audio inspection, captions, product-truth checks and every requested format before the polished preview handoff. Keep unavailable checks pending and disclose precise gaps instead of inventing evidence.
- Verify demo pacing at normal playback speed and phone viewing size: a first-time viewer must be able to identify the screen, follow the click, and understand the result without pausing or replaying. Repair rushed steps using the demo pacing preference above before handoff.
- The user is the final human reviewer. Present playable versioned export(s), a short statement of intent and any remaining specific limitation. Let the user approve or request changes in ordinary language; Codex maintains the review records. Do not hire or contact an editor or ask the user to complete technical checklists.
- Resolve blockers and major defects, with independent verification. Only the user may explicitly accept a remaining minor issue with a reason. Routine fixes stay with the producer.
- Follow the producer skill's [quality workflow](.agents/skills/envitefy-video-producer/references/quality.md) and [review handoff](.agents/skills/envitefy-video-producer/references/reviewer-brief.md). Internal completion is ready-for-user-review, not publication readiness. Record actual user approval against the exact MP4 before release; each changed file needs fresh internal review and user approval. Social publishing remains separate.
- Assess the pilot after the third new video and preserve this review arrangement until the user changes it.

## Formats and delivery

- Keep each video's exports and supporting output files in a separate `out/<campaign>/` folder. Revisions, alternate aspect ratios, intermediate renders, thumbnails, and review images belong with their original video. Do not mix different videos in the top-level `out/` folder. Briefs remain in `projects/<campaign>/`, and source assets remain in `public/projects/<campaign>/`.
- Honor the requested platform, duration, and aspect ratio. Working defaults: vertical 1080 × 1920 for TikTok/Reels/Shorts; 1080 × 1080 when square/1:1 is requested; horizontal 1920 × 1080 for a standard landscape video. Use 30 fps unless the brief calls for something else.
- “Instagram” alone does not permanently mean square. Infer from the user's context or clarify feed versus Reel when it changes the work. The Host Mode Instagram adaptation was explicitly requested in 1:1.
- Re-layout text, cards, CTA, and shot framing for each format. Inspect each export; a center crop alone may hide faces, hand actions, or card controls.
- Review the actual first frames and cuts, not only contact-sheet samples. Prior problems included a one-frame kitchen mismatch and two hands placing the same bowl.
- Deliver a locally playable MP4, a direct file link, and a concise description of the change. Add captions, thumbnails, or platform copy when requested or needed for that deliverable.

## Social post copy

- Standing preference (September 11, 2026, updated): **always deliver at least 10 distinct, relevant hashtags and/or tags with every social post for each requested platform**. The minimum applies to each post, not to a combined list across platforms. Prioritize the most popular options that fit the post’s topic, audience, and platform; do not pad the set with unrelated terms or count the same term twice as a hashtag and a keyword.
- Check current popularity when drafting, prefer platform-specific trend/search data, and keep dated sources with the campaign copy. Describe tags as “most popular” or “trending” only when current evidence supports that claim. If reliable ranking data is unavailable, still provide at least 10 relevant options and state that their popularity ranking could not be verified; never invent counts or rankings.
- Make the set ready to use: hashtags for hashtag-supported captions and comma-separated tags for YouTube’s tag field. If a platform or field limits hashtags below 10, or does not support them, include the full set of at least 10 as a clearly labeled companion tag/keyword list and identify the subset suitable for the caption. Keep platform formatting and field limits accurate without silently reducing the delivered set below 10.

## Storage and Git

- Standing preference (September 10, 2026): keep the studio's reusable knowledge on GitHub: README, project rules, this preferences guide, producer and ad creative skills and their references, blank campaign brief, written pronunciation reference, and ignore rules. Generated videos, images, audio recordings, campaign records, production source code, and scripts stay local and ignored. Keep the entire studio out of application container uploads. This supersedes the earlier skill-only tracking rule. Preserve older Git history; the user requested cleanup of the current branch only.

## Keeping preferences current

When feedback describes a lasting preference, update the relevant section above in the same task and add a short dated entry below. Keep one current statement per preference. Preserve scene-specific requests in the relevant campaign's feedback record.

Preference history:
- 2026-09-11: Future-video feedback: "Looks good but the screens go so quick it's hard to follow." Slow down demos, give each screen/action/result readable dwell time, and check first-watch comprehension during review.
- 2026-09-11: User requires a minimum of 10 popular, relevant hashtags/tags with every post for every platform; current popularity research and honest ranking claims remain required.
- 2026-09-11: Added ad creative as the producer's concept/script/storyboard stage, with direct use for written creative work and the existing brief-to-production handoff. Production-only revisions reuse saved decisions.
- 2026-09-11: User selected final review personally. Codex handles concepts, production, separate AI critique, repairs and verification in the background; no intermediate human signoff or freelance engagement. Exact-file user approval remains required for release.
- 2026-09-11: Established a future-video quality pilot with early creative review, independent human rough-cut/final review, timestamped repair evidence, and exact-export release gates. Past videos remain outside scope.
- 2026-09-10: User required Flare for video artwork. Canonical API ID is gpt-image-2.5-flare; new campaign defaults and generated-artwork import validation now record this selection.
- 2026-09-10: Added persistent static upper-left official branding, independent landscape/portrait placements with interface and content clearance, subtle contrast backing, and an exclusive final three-second centered brand card with the exact new tagline and Envitefy.com.
- 2026-09-10: User clarified that GitHub should retain the studio's reusable guidance and skills while generated media and local production files remain ignored.
- 2026-09-09: User requested popular tags/hashtags with all future generated post copy; check current popularity and relevance for each platform.
- 2026-09-09: User supplied envitefy.wav as the pronunciation reference. Direct comparison identifies in-VY-tih-fy, approximately /ɪnˈvaɪtɪfaɪ/. Both videos were matched to it; the audio reference supersedes the previous written three-syllable approximation.
- 2026-09-09: Reconciled stale brand/producer skill text and speech controls with the mandatory en-VITE-fy standard; both John Space Disco formats revised together. Earlier four-syllable decisions remain archived in campaign revision notes only.
- 2026-09-08: Saved the mandatory brand spelling and pronunciation standard in the parent ENVITEFY_BRAND.md and required explicit generation instructions and pronunciation review. The final en-VITE-fy clarification supersedes the earlier EN-vite-ih-fy wording. At the user's request, the pronunciation standard uses written guidance only.
- 2026-09-05: User requested a separate output folder for each video after reviewing the mixed export folder. Applied to existing outputs and future Studio/CLI renders.
- 2026-09-05: Captured exact branding, fresh casts and settings, no personal twin, natural audio with optional narration, real product demonstrations, action captions, demo naming, and format-specific layouts from the original production task.

- 2026-09-05: User replaced the studio wordmark with public/brand/envitefy-com.png. The supplied wordmark already contains the domain; retain its transparent background and avoid a duplicate black domain line. Scene layout choices are recorded in the campaign feedback.
