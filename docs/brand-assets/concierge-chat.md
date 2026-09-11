# Concierge sidebar icon

The user supplied `public/brand/concierge-chat.png` and requested that its empty space be removed and that it replace the Concierge navigation icon.

- The supplied file was RGB with an opaque checkerboard. Its original purple pixels were isolated using their blue/green chroma difference; antialiased edge pixels take their color from nearby solid purple pixels.
- The source PNG is now transparent and cropped to 971 × 1000 pixels, with two pixels of safety padding.
- The sidebar consumes `public/brand/concierge-chat.webp`, encoded from the cleaned PNG using FFmpeg libwebp, quality 85, compression level 6. Dimensions and the alpha channel were verified.
- Two built-in image-editing attempts retained the checkerboard and were rejected. The final icon uses the supplied artwork, not either generated variant. Both rejected PNGs were converted to verified WebPs before their originals were deleted.

Built-in editing prompt:

> Use case: background-extraction. Edit target: the provided Envitefy Concierge purple e-in-chat-bubble icon. Remove ONLY the baked-in gray-and-white checkerboard background and replace every background pixel, including enclosed spaces within the speech bubble and the e, with true alpha transparency. Crop tightly to the purple artwork bounds, leaving only 1-2 pixels of transparent safety padding so the icon fills its canvas. Preserve the existing purple e and enclosing rounded speech bubble exactly: same geometry, proportions, stroke widths, rounded ends, tail at bottom right, purple color and subtle gradient, sharp antialiased edges. Do not redesign or restyle it. Do not add a new checkerboard, any shadow, white fill, backdrop, text, border or additional symbol. Output a clean tightly trimmed transparent PNG suitable for use as the left sidebar navigation icon.

The second attempt repeated the requirement to erase every gray/white checkerboard pixel and output actual RGBA transparency. It was rejected for the same reason.
