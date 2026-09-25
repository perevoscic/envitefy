# Holiday and seasonal template collections

**All 440 photographic designs are complete and available in both Sign-up Forms and General Events: 10 designs in each of 44 collections.** The final 181 images were generated after the host resumed the earlier batch. Every image passed visual review, including five targeted corrections for unintended people or candle arrangements.

The catalog covers all 11 federal holidays, the religious and cultural celebrations listed below, and seasonal activities such as Corn Mazes, Trunk-or-Treat and Summer Camps. The signup catalog retains its previous 200 designs (640 total); General Events retains its previous 12 (452 total). Existing IDs, saved artwork paths, form schemas and explicit-save behavior are unchanged.

## Art direction

The host requested images that look less artificial after reviewing the initial corn-maze concept. Final direction: natural documentary photography, ordinary settings, soft available light, restrained color, irregular everyday details and modest decoration. Avoid glossy rendering, cinematic orange sunsets, dramatic rays, excessive blur and perfectly staged symmetry. Each design has its own scene and image, plus one of ten curated signup compositions with coordinated typography and colors.

The exact prompt set, provider, source, final path, dimensions, checksum, conversion and review records are in `holiday-template-artwork.json`. The first 85 images came from built-in OpenAI ImageGen; the other 355 came from the explicitly approved, separately billed OpenAI API fallback. The fallback uses the imagegen skill's bundled CLI with `gpt-image-2`, medium quality, 1536 × 1024, one job per distinct scene. Five images also received focused edits through that CLI; their exact correction prompts and superseded WebP checksums are recorded under `revisions`. No Google provider is used.

Final application assets live at `public/templates/signup/holidays/<collection>/<design>.webp`. FFmpeg encodes at quality 85/compression 6, preserving dimensions. Originals are deleted only after decode/dimension verification and visual review. Inspection sheets and screenshots live in ignored `output/seasonal-templates` and `output/seasonal-gallery`.

## Coverage

* **Federal:** New Year’s Day, Martin Luther King Jr. Day, Presidents’ Day, Memorial Day, Juneteenth, July Fourth, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas.
* **Other celebrations:** New Year’s Eve, Valentine’s Day, St. Patrick’s Day, Mardi Gras, Easter, Mother’s Day, Father’s Day, Earth Day, Cinco de Mayo, Halloween, Indigenous Peoples’ Day, Día de los Muertos.
* **Religious and cultural:** Lunar New Year, Passover, Rosh Hashanah, Yom Kippur, Sukkot, Hanukkah, Kwanzaa, Ramadan, Eid al-Fitr, Eid al-Adha, Diwali, Holi, Nowruz, Vaisakhi.
* **Seasonal activities:** Corn Mazes, Trunk-or-Treat, Fall Harvest, Friendsgiving, Summer Camps, Back to School, Graduation.

Solemn observances use restrained settings and respectful copy. Indigenous Peoples’ Day imagery avoids invented tribal patterns and sacred objects. Cultural examples never become host-provided facts.

## Discovery behavior

Full galleries default to **Seasonal picks**, using the visitor’s local civil date and a 90-day planning window. Relevant collections are interleaved so one holiday cannot fill the first page. New photographic designs lead each timely collection; original ordering remains available. All templates remain reachable, and search/style/audience filters combine with **Holiday or occasion**. Other galleries reuse explicit season metadata or a small curated ID mapping, without inferring an occasion from incidental words. Featured landing collections retain their existing ordering and presentation.

The initial server/client render uses the same canonical order to avoid hydration mismatch. The browser updates after mounting, at local midnight, and when the page regains focus or visibility. Date-only arithmetic avoids daylight-saving and host/server-timezone shifts. Gallery timing never populates or changes an event’s date, brief, category, signup slots or saved data.

Federal dates follow their actual holiday dates rather than office-closure substitutions. Gregorian Easter drives Easter and Mardi Gras. Browser calendar data drives Hebrew, Chinese, Persian and Umm al-Qura discovery windows; unsupported calendars never silently fall back to Gregorian dates. Eves and multi-day celebrations are included. These are planning windows, not promises of a religious observance time: regional and community practices can differ. Diwali and Holi have verified dates through 2028, with broad seasonal discovery windows after that instead of guessed dates.

Sources: [U.S. Office of Personnel Management holiday rules](https://www.opm.gov/frequently-asked-questions/pay-and-leave-faq/pay-administration/what-are-federal-holidays/), [U.S. Naval Observatory Easter calculation](https://aa.usno.navy.mil/faq/easter), [Unicode calendar identifiers](https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml), [Drik Panchang Diwali dates](https://www.drikpanchang.com/hindu-festivals/diwali/diwali.html?lang=en), [Drik Panchang Holi dates](https://www.drikpanchang.com/hindu-festivals/holi/holi.html?lang=hi).

## Maintenance and checks

Curated source and prompts: `scripts/build-holiday-collections.py`. Asset installation/review/verification: `scripts/process-holiday-artwork.py`. Inspection sheets: `scripts/review-holiday-artwork.mjs`. Manifest, availability list and shared General Events palette CSS: `scripts/publish-holiday-templates.py`. Publishing normally requires all final artwork to exist and pass visual review. `--available-only` exposes just verified, reviewed designs when generation stops partway; `--allow-in-progress` is only for local implementation work and was not used for the final catalog.

For future additions, select only assets with `status: "pending"` from the prompt record. After generation, install, visually review and clean up those exact originals, then rerun the publisher. Complete-catalog verification requires all 440; `verify --available-only` is reserved for partial batches. The availability guard remains in place so future unfinished artwork cannot enter either gallery or direct template lookup.

Regression coverage includes moving holidays, leap days, rollover, May and fall recommendations, stable original order, collection/asset/layout coverage, empty new forms, direct editor links, combined filters, keyboard controls, narrow screens, authentication-disabled generation, and midnight refresh. Existing signup/custom-event suites remain applicable. The optional VS Code diagnostics bridge is unavailable on this host; application typechecking and scoped Biome run directly. The repository-wide lint command also reports existing unrelated errors in scripts and archived artifacts.

Final validation passed: 85 targeted tests, the desktop/mobile seasonal-gallery browser suite, application typechecking and scoped Biome. All 440 final assets passed checksum, WebP decode, dimension, visual-review and original-cleanup checks. Their total size is about 83.1 MiB. The browser suite also checks decoded and painted Diwali artwork at desktop and phone sizes. No generation is still running.

Generation logs and historical batch inputs remain in ignored `output/seasonal-templates`; do not rerun those inputs without filtering against current asset status, since every listed job is now complete. Preview screenshots are in `output/seasonal-gallery`, including `general-diwali-1280.png` and `signup-forms-diwali-320.png`.
