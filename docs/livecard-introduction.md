# Live Card introduction

The signed-in Live Card sidebar entry opens a compact product introduction at `/live-cards` before the creation form. Its central promise is: “An invitation that keeps up with you.” A short video accompanies six benefits: custom design, changes to event details, RSVP responses, registry links, directions/calendar actions and link/JPEG sharing.

The silent, approximately 17-second video at `public/videos/live-card-demo.mp4` records the actual `StudioShowcaseLiveCard` component using the existing Carter Housewarming sample. Overview, RSVP, Location and Calendar open on one stationary card. No RSVP is submitted and no outbound action is activated. A capture-only sample contact replaces the old placeholder email; the saved sample is unchanged. The old Host Mode export was referenced in studio documentation but unavailable locally, so this is a new recording of the same sample, not recovered footage.

The video has a compact Watch demo button, then native play/pause, seeking and fullscreen controls, an original-color WebP poster, descriptive English captions and inline phone playback. Playback starts on request, with `preload="none"` and no autoplay. This avoids automatic video downloads and motion when the page opens. A failed video load retains an explicit retry. Capture sources and review records remain local under `video-studio/projects/livecard-intro-demo/` and `video-studio/out/livecard-intro-demo/`.

“Create your Live Card” opens the existing builder at `/live-cards?create=1`. Non-empty `edit` and `intake` parameters bypass the introduction, so saved cards and imports retain their direct editor paths. Authentication remains required for both screens. The introduction is a server component with a small client video control and no creation, generation or persistence effects.

Updates require an explicit save. Wording printed in generated artwork retains the builder’s explicit Update card text action. The presentation does not promise automatic guest notifications or calendar synchronization. Existing artwork is displayed in its original colors; application copy and controls follow light/dark appearance. The layout adapts to both the viewport and the available width beside the sidebar.

Verification: `npm run typecheck`, the route/security cases in `scripts/livecard-builder-access.test.mjs`, creation handoff tests, and desktop/phone browser layout and accessibility checks.
