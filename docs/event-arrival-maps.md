# Handout parking and drop-off maps

Custom Event Pages support a structured `map` on each optional details section. The original annotated map, Mapbox street-map snapshot, view geometry, marker labels/instructions, normalized pixel positions and per-marker confirmation persist in the existing event JSON. Older pages remain compatible.

## Import and later editing

The existing OpenAI information reader requests up to three detected map sources: an information-image index, map crop, associated section index and up to six explicitly marked locations. Document instructions are guest facts, never commands. The server crops only map evidence and encodes it as verified WebP with FFmpeg. Invalid map metadata never discards successfully read event facts.

A unique Mapbox permanent street-address match supplies the view; no model provides geographic coordinates. The static image uses streets-v12 at zoom 16, north up, 960×640, with Mapbox/OpenStreetMap attribution retained. An OpenAI comparison can propose marker pixels by matching actual roads, parking outlines and shorelines. Those pixels always require host confirmation. Unreadable or off-screen features remain unplaced. A venue centroid is never treated as a parking location.

Existing pages have one **Add parking / drop-off map** control at the end of Page sections when no map is attached. Uploading reuses a uniquely named parking and drop-off section, or creates **Parking & drop-off** when no unique section exists, respecting the 20-section limit. **Replace source map**, marker editing and **Refresh map from event address** appear only beside an attached map. Refresh sends only the address/coordinates to Mapbox, does not resend a handout to vision, and resets positions for the new view. Address/provider failures preserve the existing map in the editor. Host taps/arrow keys place markers; **Confirm marker position** enables precise directions. Guest views hide proposed positions and automatically expand the annotated source when positions remain unconfirmed.

Images remain in memory until explicit Save draft, Save changes or Publish. Both maps persist as original WebPs through the existing media service at that save; importing, moving markers, previewing and refreshing never write an event. Map upload failure prevents the event write. Appearance refinements and proofreading preserve maps. Removing/reordering a section carries its map with it.

Pixel-to-coordinate conversion uses Web Mercator with a 512px world at zoom zero. Responsive rendering scales the whole provider image without cropping.

## Supplied Camp Helen example

The handout describes the Gateway field trip on October 5, 2026 at Camp Helen State Park. Printed instructions say to park by the Rec Hall and reserve the closest spaces for pumpkin-patch visitors. The handwritten map labels parking near the north entrance loop and a separate student drop-off farther south. Preserve that distinction and resolve the apparent parking discrepancy before confirming navigation pins.

[Florida State Parks](https://www.floridastateparks.org/parks-and-trails/camp-helen-state-park) verifies the public address: 23937 Panama City Beach Parkway. The local Mapbox permanent lookup returned longitude -85.99046, latitude 30.27481. The provider snapshot and locally proposed two-marker preview are in `output/arrival-map-preview/`. No saved event was modified by this verification.

After the user identified the missing map on the existing event, the source crop and Mapbox snapshot were explicitly saved to `gateway-field-trip-2nd-grade-2026` (event `7b6e65fd-7e08-4049-bafb-20a95abf1ee2`). The address was corrected from 29397 to 23937. Both area positions remain unconfirmed, with no precise marker directions. Automatic approval review rejected confirming approximate positions without the host's confirmation. The authenticated owner was matched before using the existing revision-checked save service. The ordinary development-server upload timed out at 65 seconds; the same configured Blob service responded outside that restricted environment. Uploaded images loaded at 960×640 and 355×228 after reloading the actual local event route. The existing live deployment showed the corrected text/address but did not render the new map structure; it still needs the map code deployed.

## Verification and extension

- `node --test src/lib/event-arrival-map.test.cjs scripts/arrival-map-browser.test.mjs` checks normalization, provider failures, source crops, no automatic pin confirmation, geographic conversion, explicit persistence, keyboard placement, desktop/375px/landscape layout and map-section accessibility.
- The real Mapbox geocoder/static-image request succeeded. Supplied images stayed local for the preview; Mapbox received only the public address and coordinates.
- The user explicitly approved the OpenAI image test after the initial automatic approval rejection. The live reader retained nine handout sections and both parking/drop-off annotations. Its first pixel alignment was inaccurate; a diagnostic coordinate grid and a requirement that every annotation be visible in the retained crop improved the second attempt to the parking-road area. Exact geographic pin accuracy remains subject to host confirmation. The diagnostic grid is never saved in the source/provider map.
- `scripts/render-arrival-map-preview.mjs` renders the actual live extraction result through the shared Event Page renderer. Final desktop and phone screenshots are `output/arrival-map-preview/live-parking-section-1280.webp` and `live-parking-section-375.webp`. The local handout-reading fallback and its manually proposed preview remain separately available; they are not the live OpenAI result.
- Scope is custom Event Page information-image uploads and section attachments. Generic Snap/OCR and football/gymnastics discovery do not yet supply this structure. To extend them, preserve the source crop and authoritative annotations, reuse `prepareArrivalMap`, leave ambiguous features unplaced and expose the same confirmation controls. PDF sources first need the existing rasterization pipeline to provide legible page images; this change does not add PDF upload to the custom image chooser.
- This is a static snapshot. Pan/zoom, regional maps beyond the local view, schematic campus plans and path/polygon overlays need a separate viewport/geometry workflow; retain the original when alignment is unavailable.

Provider reference: [Mapbox Static Images API](https://docs.mapbox.com/api/maps/static-images/).
