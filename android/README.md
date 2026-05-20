# Envitefy Android Wrapper

This is the native Android Trusted Web Activity wrapper for Envitefy.

The wrapper exists because Android's system navigation bar is outside normal PWA
CSS. The web app can set `theme-color` for top browser/status chrome, but it
cannot reliably set the bottom multitasking/home/back bar. This wrapper sets the
two system bars independently:

- status bar: `#FFFFFF`
- navigation bar: `#8D7BE9`

The colors live in `app/src/main/res/values/colors.xml` and are wired into the
TWA launcher metadata in `app/src/main/AndroidManifest.xml`.

Before a production TWA release, publish a Digital Asset Links file for the
signing certificate at:

```text
https://envitefy.com/.well-known/assetlinks.json
```

Template:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.envitefy.app",
      "sha256_cert_fingerprints": ["REPLACE_WITH_RELEASE_CERT_SHA256"]
    }
  }
]
```

Without the matching certificate fingerprint, Chrome may fall back to custom tab
behavior instead of full trusted-app behavior.
