#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS builds require macOS and Xcode." >&2
  exit 1
fi
xcodebuild -version
mode="${1:-simulator}"
if [[ "$mode" == "simulator" ]]; then
  xcodebuild -project Envitefy.xcodeproj -scheme Envitefy -configuration Debug \
    -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath .local/DerivedData CODE_SIGNING_ALLOWED=NO build
elif [[ "$mode" == "test" ]]; then
  : "${IOS_SIMULATOR_ID:?Set IOS_SIMULATOR_ID from xcrun simctl list devices available}"
  xcodebuild -project Envitefy.xcodeproj -scheme Envitefy -configuration Debug \
    -destination "platform=iOS Simulator,id=$IOS_SIMULATOR_ID" \
    -derivedDataPath .local/DerivedData CODE_SIGNING_ALLOWED=NO test
elif [[ "$mode" == "archive" ]]; then
  : "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID to your enrolled Apple Developer team}"
  node scripts/verify.mjs --release
  xcodebuild -project Envitefy.xcodeproj -scheme Envitefy -configuration Release \
    -destination 'generic/platform=iOS' -archivePath .local/Envitefy.xcarchive \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" -allowProvisioningUpdates archive
else
  echo "Usage: bash ios/scripts/build-mac.sh [simulator|test|archive]" >&2
  exit 1
fi
