# Host mode

22 seconds, 1080 × 1920, 30 fps, H.264/AAC MP4.

- 0–4 s: a fictional host reacting to an increasingly busy group chat. Six visible notification bubbles with synchronized sound effects.
- 4–4.5 s: hard cut to “pause.”
- 4.5–12 s: actual Envitefy showcase screenshots: invitation, RSVP, location and calendar. The showcase is an existing public sample, not a new customer event.
- 12–22 s: the same fictional host welcoming guests and enjoying the party. Closing CTA over the final toast.

Human footage: two original 10-second Gemini Omni 1.1 Flash clips. The second refers to the first generation to preserve the host, wardrobe and setting. Original source resolution is 720 × 1280 at 24 fps; Remotion lays out text at 1080 × 1920 and exports at 30 fps.

Music: original Lyria 3 Clip instrumental, with a custom synthesized notification introduction. No scripted narration or voice clone. ElevenLabs Music was unavailable on the configured free account; no ElevenLabs audio is used in this cut. Build the introduction with `node scripts/compose-host-soundtrack.mjs`, then create the final mix with `node scripts/mix-host-soundtrack.mjs`. Both commands run from `video-studio`.

Brand assets: exact copies of `public/email/envitefy-wordmark-email.png` and `public/icons/apple-touch-icon-120.png` from the parent project, used in their original colors and aspect ratios.

Suggested post caption: “You offered to host. The group chat heard ‘personal assistant.’ Put the details in one Envitefy link—and get back to your people. ✨ envitefy.com #Hosting #PartyPlanning #Envitefy”

No posting, event creation, messages, or RSVP submissions were performed.

Revision 2: skip the stray opening frame using a two-frame source trim, display `housewarming@envitefy.com` in the RSVP capture, use the exact label “Envitefy Live Card Demo,” and replace the bowl shot with an isolated video edit showing only the beige-sleeved hand placing the bowl. The replacement covers party-local frames 89–148 (the source shot spans frames 71–118 at 24 fps). The original party footage and audio continue outside this replacement. `bowl-source.mp4` preserves the two-second input, and `bowl-single-hand.mp4` is the selected corrected output. The earlier full-scene edit is unused because it changed the setting.

Revision 2 export: `out/envitefy-tiktok-host-mode-v2.mp4`. Reviewed the first six exported frames, the corrected RSVP capture and label, the edited bowl shot, and both cut boundaries. The export is 1080 × 1920 at 30 fps, 22 seconds of video, with no detected black gaps. Audio peak remains -2.5 dBFS. ESLint, TypeScript and Biome passed; the optional editor diagnostics bridge remained unavailable.

Revision 3 adds a synchronized explanation below each live card: “All the details, in one place,” “RSVP on the spot,” “Directions, one tap away,” and “Add it to your calendar.” The card is slightly smaller and higher to make room for the action text above the “Envitefy Live Card Demo” label. Export: `out/envitefy-tiktok-host-mode-v3.mp4`.

Validation: final export is H.264, 1080 × 1920 at 30 fps, AAC stereo at 48 kHz, 17.1 MB. Video content is 22 seconds (MP4 container is 22.059 seconds with audio padding). Decoding found no black gaps; peak audio is -2.5 dBFS. Reviewed the sequence contact sheet and closing frame, and verified the copied brand images match their source SHA-256 hashes. ESLint, TypeScript, Biome and the existing five narration utility tests passed. The editor diagnostics bridge was unavailable, so standalone TypeScript checking was used.

Instagram square version: `EnvitefyHostModeSquare`, 1080 × 1080 at 30 fps, 22 seconds. Shared scene components adapt to square dimensions: the hook and notifications are repositioned around the host, product cards sit beside their feature headlines with action captions below, party shots receive individual vertical framing, and the closing CTA fits beneath the toast. All revision 3 corrections, brand assets and audio remain in use. Render with `npm run render:instagram` to `out/envitefy-instagram-square.mp4`.

Square export validation: H.264, 1080 × 1080, 30 fps, AAC stereo at 48 kHz, 10.3 MB. Reviewed the opening frame, all four product states, single-hand bowl shot and closing CTA in the exported file. Full decoding found no black gaps; audio peak is -2.5 dBFS. ESLint, TypeScript and Biome passed; the editor diagnostics bridge remained unavailable.
