# Calendar app handoff

`src/utils/calendar-open.ts` owns browser navigation for the shared calendar chooser and Apple event links.

This is the standard for all manual event actions: Snap/Upload invitations and schedules, Live Cards, event pages, category editors, gymnastics meets and football games. Build data with `buildCalendarLinks`, then use `CalendarAction` or `useCalendarAction`. Custom provider callbacks and template-local native schemes are prohibited; `npm run test:calendar` checks this and runs in Create remediation CI.

New RSVP email calendar links use `buildCalendarHandoffPath` and the public `/calendar/add` page. The page accepts event fields, never a redirect URL, and launches only after the recipient taps a provider. This keeps email scanners harmless and preserves the user gesture required by mobile browsers. Previously sent emails retain their original links. Account connection, automatic sync, explicit ICS downloads and account calendar subscriptions keep their separate flows.

- Google keeps its HTTPS event link. On phones it opens from the current tap so the OS can hand it to an associated app.
- Timed Outlook events try `ms-outlook://events/new`. Android wraps this in an intent for `com.microsoft.office.outlook`, with the complete Outlook web URL as Chrome's fallback. iOS/iPadOS use the custom scheme directly.
- Keep the chooser's **Open Outlook in browser** and **Download event** links available after an Outlook attempt, including when a saved provider bypasses the initial chooser. No timeout claims that an app is missing or opens a second event after the user returns.
- Outlook's mobile compose scheme is best effort: versions can ignore fields. All-day events retain the web flow because the mobile scheme has no documented all-day contract. Missing ends stay absent; provided offsets and ends are preserved.
- Apple event buttons use the inline `text/calendar` response in the same tab on iOS, iPadOS and macOS. The browser can offer an import sheet or download an ICS file that the user opens in Calendar. Do not silently turn a one-time event into a `webcal:` subscription. The separate account calendar-subscription feature is unchanged.

Browsers do not expose a general installed-app inventory. Chrome's related-app API requires a verified website/app relationship, which Envitefy does not have with Outlook or Google Calendar. Never report a successful save from navigation or page visibility alone.

Sources:

- [Chrome Android intents and fallback behavior](https://developer.chrome.com/docs/android/intents)
- [Chrome related-app detection requirements](https://developer.chrome.com/docs/capabilities/get-installed-related-apps)
- [Microsoft's Outlook scheme discussion and compatibility caveats](https://learn.microsoft.com/en-us/answers/questions/202137/ms-outlook-events-new-scheme-url)
- [Apple calendar import](https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac)
- [Apple calendar subscriptions](https://developer.apple.com/library/archive/documentation/AppleApplications/Conceptual/CalendarScriptingGuide/Calendar-SubscribetoaCalendar.html)

Automated coverage checks routing, encoding, timezone preservation, absent/explicit ends, fallback controls and duplicate prevention. Real Android/iOS/macOS app acceptance still needs device verification: test Outlook installed and absent, verify title/start/location in the composer, cancel without saving, and check Apple's import flow in Safari and Chrome. A desktop viewport emulation cannot validate native app handoff.
