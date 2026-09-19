# Envitefy Android 1.0.3 — icon without the white frame

Date: September 18, 2026. Status: **active and available to Internal Testing testers**.

Version 1.0.2 placed the entire rounded icon PNG inside a white adaptive-icon
background. The user confirmed this created a visible white frame on their phone.

The new Android resource separates the mark from its background. An opaque
blue-purple gradient covers the entire adaptive layer, without an inset,
rounded inner tile or border. The foreground uses the existing transparent
`public/brand/e-only.png`, copied unchanged to `public/icons/android-foreground.png`
and then to the native resources by `android/scripts/sync-icons.mjs`. Android XML
tints this mark white and retains its 256:165 aspect ratio. Android supplies the
outer launcher shape. The legacy density icons remain unchanged.

## Artifact and checks

- Package `com.envitefy.app`; version **1.0.3 / code 5**.
- AAB: `android/releases/1.0.3-5/Envitefy-1.0.3-5.aab`.
- AAB SHA-256: `70892e70f41a9cd7602a6d25a257a2b213c911cd866587946953e5cf48ea3a1c`.
- APK SHA-256: `9274b5f94e9202e31f5414183350a67f79287099ccbcd9a252d2f010a073bbaf`.
- Release APK/AAB build, Android lint, bundletool validation and APK/AAB
  signature verification passed. The existing signing key is retained.
- Seven Android regression checks and Biome lint on the modified script passed.
- The packaged foreground was decoded and matches the source mark pixel-for-pixel.
  Its opaque pixels fit inside Android's 33dp safe circle (32.02dp maximum).
- The decoded manifest retains version 1.0.2's permissions and optional hardware
  requirements. Launcher code and device-access behavior are unchanged.
- Android lint has zero errors and three existing warnings: newer Gradle,
  optional monochrome icon and the trusted-browser exported service.

This verifies the packaged resources and safe-zone geometry. The exact rendered
appearance still needs confirmation on the user's launcher after updating; no
new physical-device or end-to-end camera/location test was performed here.

[Internal Testing](https://play.google.com/apps/internaltest/4699523210540474676).

## Distribution

Published **1.0.3 (5) — Full-color launcher icon** to the existing internal tester
track. Play Console confirms Active, Available to internal testers, one version
code, and release time **September 18, 7:08 PM**. No devices lost support. Only
code 5 is included; the prior release's code 4 is excluded. Play's sole warning
is the expected missing deobfuscation file for this non-minified wrapper.

Update the existing Play installation. The icon should refresh with the update;
its exact mask and any outer shadow remain controlled by the phone's launcher.
Play says updates usually appear within one hour, but may take longer.

[Release details](https://play.google.com/console/u/4/developers/9210338056613116669/app/4973399946558335612/tracks/4699523210540474676/releases/4/details).
