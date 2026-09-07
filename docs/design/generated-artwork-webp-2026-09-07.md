# Generated artwork WebP conversion — September 7, 2026

All **144** images generated on September 7, 2026 (America/Chicago) were re-encoded from their original PNG sources with **FFmpeg 8.0 / libwebp**. The served assets remain at their existing `.webp` URLs.

| Collection | Images |
| --- | ---: |
| Birthdays | 94 |
| Anniversaries | 30 |
| Weddings | 20 |
| **Total** | **144** |

- Encoding: quality 85, compression level 6, picture preset, metadata stripped.
- All original dimensions and aspect ratios are preserved, including portrait artwork and the 1535-pixel-wide image. No resizing or upscaling.
- Original PNGs: **363.44 MB**. Final WebPs: **33.58 MB** (90.8% smaller than the PNGs).
- Previous served WebPs: 33.97 MB; the FFmpeg pass saves an additional 389 KB.
- FFprobe confirms all 144 outputs are actual WebP bitstreams with the expected dimensions.
- FFmpeg fully decoded every output and compared it with the source: mean SSIM **0.9812**, minimum **0.9620**.
- All 144 source PNGs map to one unique served image. All 144 source PNGs were deleted at the user’s request after verifying their WebP replacements, freeing 363.44 MB. Previous served WebPs were backed up under `/tmp/envitefy-ffmpeg-webp-2026-09-07/before/`.
- Twelve regression checks pass across the birthday, anniversary, and wedding collections.
- Application artwork references already use `.webp`; no source-code reference changes were needed.

Per-file provenance, dimensions, hashes, byte counts, and fidelity scores: [conversion manifest](./generated-artwork-webp-2026-09-07.json).

The older email icons, brand image, and review screenshots with checkout timestamps from today predate this generation batch; their last relevant commit was September 5, 2026.

Reproduction command (one image):

```sh
ffmpeg -hide_banner -loglevel error -nostdin -y -i SOURCE.png \
  -map_metadata -1 -frames:v 1 -c:v libwebp -preset picture \
  -quality 85 -compression_level 6 -lossless 0 -pix_fmt yuv420p OUTPUT.webp
```
