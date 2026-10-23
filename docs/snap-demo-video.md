# Snap demonstration video

The signed-in `/snap` introduction uses the user-supplied `V2.mp4` gymnastics-poster demonstration beside the explanation and the existing camera/upload actions. The original is a 940 × 1672 H.264/AAC portrait video, approximately 12 seconds and 6.76 MB. The supplied original remains unchanged.

Web assets preserve the entire portrait frame, original soundtrack, embedded text and sequence:

- `public/videos/snap-gymnastics-demo.webm`: 720 × 1280 VP9/Vorbis, approximately 1.20 MB.
- `public/videos/snap-gymnastics-demo.mp4`: 720 × 1280 H.264/AAC, approximately 1.38 MB, with fast-start metadata before media data.
- `public/images/snap-gymnastics-demo-poster.webp`: a frame extracted at four seconds, 720 × 1280, encoded with FFmpeg `libwebp`, quality 85 and compression level 6.

FFmpeg encoded the video with `scale=720:-2`, preserving the frame with even dimensions. The MP4 uses `libx264`, preset `slow`, CRF 25, High profile, level 4.0, `yuv420p`, AAC at 96 kbps and `+faststart`. The WebM picture uses `libvpx-vp9`, CRF 34, zero target bitrate, row multithreading and CPU-used 2; its final audio is `libvorbis` at quality 3. Both final files were fully decoded for verification.

The video autoplays muted on a continuous loop, with inline playback, no visible player controls and `preload="auto"`, as requested on October 22, 2026. WebM is first with MP4 fallback; both files retain the original audio track while page playback is muted for browser autoplay support. The poster remains available while the video loads. The player retains the full frame with `object-fit: contain` and sits below the explanation on narrow workspaces. The adjacent caption describes the gymnastics example; video content never enters event intake or triggers a save.
