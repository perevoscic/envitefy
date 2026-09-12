# ScoreStream scoreboards in football events

## Required event behavior — scope clarification

The user clarified that an event page should show scores only for the games listed in that event. Adding a scheduled game should eventually match the exact provider fixture and display that game's reported score in its game card. The statewide widgets below do **not** implement that behavior. Do not present their existence, a selected state, or a team scoreboard as automatic event-game matching.

Automatic score retrieval is not connected. The current game model has manually entered score/result fields but no ScoreStream game identity or API data feed. The required follow-up is to obtain ScoreStream partner API documentation/access, resolve the participating teams plus sport/squad and date/time to a unique provider game, and refresh only those matched games. Ambiguous or missing matches must remain without a fetched score rather than borrowing an unrelated game's result. A missing score is not zero. Preserve manual edits and explicit event saves. Localhost is the requested development/test target.

The supported free widgets are separate scoreboards configured around teams or geography. ScoreStream's [partner API description](https://blog.scorestream.com/scorestream-local-sports-api/) is the documented path for automated data in custom layouts; current commercial access and payloads still need confirmation. The existing 51 widgets may be retained as provider account resources, but they are not a substitute for the requested event-only integration.

## Existing widget implementation

September 12, 2026: 51 ScoreStream widgets have been created in the Envitefy account, covering the 50 U.S. states and Washington, D.C. The integration uses ScoreStream's supported iframe scoreboard. Partner API access remains a separate setup for placing normalized scores into Envitefy's own game cards.

## Setup

1. Open the football editor and choose **Live scores**.
2. Choose **State or district** for a configured statewide high-school varsity scoreboard. Event owners do not need their own ScoreStream account for these widgets.
3. For a specific team, expand **Use a team or custom scoreboard**, create the widget in ScoreStream, and paste its current embed code, iframe code, or widget URL. A team profile URL will not work.
4. Check the preview, then explicitly save or publish the event. **Remove scoreboard** removes the connection from the current editing state; save to keep that change.

The default connection is specific to each event, and a new event starts with no state selected. The state catalog uses real shared widgets; custom team connections remain supported. Visitors can browse other states without changing the event's saved default. The widget's selected teams and game coverage determine what visitors see. Recheck the selected state or teams when importing a different schedule.

Official setup: [ScoreStream widget creator](https://scorestream.com/widgetCreators/scoreboards/vert), [scoreboard guide](https://scorestream.com/make-a-scoreboard-widget). The provider documents the iframe URL format in its [embed example](https://blog.scorestream.com/march-madness-scoreboards/).

## Behavior

- The event's **Live scores** section is shown only for a recognized ScoreStream widget link. Both the selected-template renderer and legacy football renderer support it, including editor and owner previews.
- The embed loads lazily into a reserved, responsive frame. A direct ScoreStream link remains available if the iframe cannot load.
- Editing the connection follows the existing explicit-save and unsaved-progress flow. No draft is created by pasting a link, opening a preview or loading scores.
- Vertical and banner widget URLs/iframes are accepted, along with the current vertical `scorestream-widget-container` embed code. Parsing reconstructs an HTTPS URL on `scorestream.com` using only a validated layout and numeric `userWidgetId`; pasted attributes and scripts are never executed.
- The browser loads the provider's supported iframe. No private ScoreStream API is called, API key is required, or site data is scraped by this integration.
- Existing manual scores remain available. Embedded scores are not copied into game records and no standings or group positions are inferred from them.

## Storage and extension point

The editor stores the connection at `advancedSections.scores.scorestreamWidgetUrl`, with the existing `customFields.advancedSections` compatibility copy. Valid input is normalized immediately; incomplete editing input can remain in a draft and is excluded from rendering. The public normalizer validates again before exposing the iframe URL.

`src/lib/scorestream-states.ts` is the catalog of saved state-to-widget mappings. These are public embed IDs, not credentials. All 51 creations returned success and distinct IDs, `70302` through `70352`; the account manager subsequently listed all 51. Each uses Football only, boys/girls high-school varsity, a state-specific title, a searchable light layout, responsive width, 600px height, and Envitefy's purple/blue colors. Contact phone fields were left blank. This covers geographic selection, not every game, squad level, territory, or guaranteed reporting.

For future native score cards and verified group standings, obtain current ScoreStream partner documentation, credentials and display terms. The provider's [partner API announcement](https://blog.scorestream.com/scorestream-local-sports-api/) offers trial access by inquiry. That work must establish game IDs, coverage, corrections, complete standings and tiebreak semantics before displaying native results.

## Activation status

The user explicitly approved creating all 51 widgets, and creation is complete. The state selector and custom-code support are implemented locally. No customer event was automatically edited, saved or published, and no application deployment was performed. Group standings, tiebreakers, NFL and college coverage remain separate from this high-school scoreboard setup.

Validation: 32 focused tests passed, including complete/unique state coverage, parsing and malicious input, section visibility, stored configuration and preview rendering. Game-card regression coverage now verifies that a supplied score appears even without a Win/Loss/Tie result, zero-zero remains a valid supplied score, missing scores stay blank, and one game's score is never copied into the next card. The changed ScoreStream production modules passed direct TypeScript checking. The VS Code diagnostics command could not connect because its linter bridge was unavailable.

The granted localhost session was verified in the South Walton Seahawks Football owner view. Its saved results appeared alongside the corresponding scheduled games. These are stored event scores, not evidence of a ScoreStream API connection. The editor remained at its loading screen during this check, so no browser edit/save test was completed and no event data was changed. The shared game renderer now displays a score independently of the optional final result, using a neutral “Score” label when no result is supplied. This renderer passed Biome and a direct TypeScript check with zero diagnostics; the VS Code diagnostics bridge remained unavailable.

An isolated local browser check uses the actual React components and app styles with real provider URLs. It verified initial empty selection, Florida selection, visitor switching to Texas while the owner's Florida value stayed intact, current-code canonicalization, invalid-link feedback, removal, and mobile layout at 390px. Desktop frame sizing was verified at 1440px. No parent-page JavaScript errors were reported. Full authenticated editor save/publish was not exercised.

The saved Alabama widget loaded directly and displayed provider-reported results. Cross-site iframe delivery remains unverified: this local in-app browser displayed blank frames for the application iframe, a plain eager iframe, and ScoreStream's own current script embed. The provider-generated iframe URL matched the integration's URL exactly. Keep the visible **Open scoreboard in ScoreStream** fallback. Verify embedding in the deployed application's target browsers before claiming end-to-end live delivery or promoting it as verified. Automated checks do not establish score accuracy or provider uptime.
