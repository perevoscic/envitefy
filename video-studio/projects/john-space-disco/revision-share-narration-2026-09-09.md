# Approved pronunciation and sharing narration — September 9, 2026

The user explicitly confirmed that the current pronunciation is perfect and asked to store it. The approved acoustic reference and stock Jessica take are saved in assets/brand/audio/, with SHA-256 hashes and the approval in pronunciation.json. The audible reference remains authoritative; in-VY-tih-fy /ɪnˈvaɪtɪfaɪ/ is an approximate internal description.

Added the stock Jessica sentence “One easy link. All the party details.” at 12.25 seconds in both versions. The music dips smoothly beneath the new voice and returns afterward. The accepted Concierge narration asset is reused byte-for-byte. Native dialogue and all previous timing remain intact.

Exports: vertical V11 and horizontal V9. Both are exactly 30 seconds at 30 fps (900 frames), with H.264 video and stereo 48 kHz AAC audio. Full decoding passed. Every compressed video packet matches its previous export, preserving the dinosaur-left/John-right ending and all other visual corrections.

The two final sharing-scene audio clips were checked with Gemini audio review: exact requested sentence, clear over music, natural delivery, complete ending, clean transitions, no issues. Only the new stock adult narration/music clips were submitted; no user recording or character dialogue was uploaded for this revision. The accepted brand narration hash is unchanged.

Verification: share-narration-verification.json and share-narration-audio-review.json. TypeScript, changed-file ESLint and Biome, and the video skill validator passed. The optional editor diagnostics bridge remains unavailable as previously recorded; standalone checks passed. Previous exports are retained. User approval applies to the pronunciation; these new completed videos are assistant-reviewed.

Reproduction: scripts/john-voice.mjs share v1 eleven_flash_v2 (cached), scripts/revise-john-share-narration.mjs, scripts/verify-john-share-narration.mjs. The revision script preserves existing outputs instead of overwriting them.
