# Envitefy legal and privacy launch checklist

This is an operational checklist, not legal advice. Product text and controls reduce risk but do
not eliminate claims or replace review by counsel familiar with the company, users, and launch
markets.

## Required before production marketing

- Set `LEGAL_ENTITY_NAME` to the exact contracting company or individual name.
- Set `LEGAL_CONTACT_EMAIL`, `PRIVACY_CONTACT_EMAIL`, and `DMCA_CONTACT_EMAIL` to monitored
  addresses.
- Set `LEGAL_POSTAL_ADDRESS` to a valid physical postal address. The campaign sender intentionally
  refuses to send marketing email without it.
- Set a stable, high-entropy `MARKETING_UNSUBSCRIBE_SECRET` so links remain valid when authentication
  secrets rotate.
- Set a stable, high-entropy `PRIVATE_ACCESS_LOG_SALT` for pseudonymous network evidence in private
  content access logs.
- Have counsel select governing law, venue, and—only if appropriate—an arbitration and class-action
  approach. The current Terms deliberately do not invent those facts.
- Confirm that every vendor named or described in the Privacy Policy matches production reality,
  and sign required data-processing agreements.
- Review Google API Limited Use, Microsoft platform terms, email-marketing rules, state privacy
  laws, international transfer requirements, and accessibility requirements for actual launch
  regions.

## Required operations

- Apply `prisma/manual_sql/20260901_add_legal_privacy_controls.sql` and the scan-attempt migration.
- Schedule `npm run purge:expired-private-data -- --apply` at least daily and alert on failures.
- Test unsubscribe links end to end in every campaign template and monitor suppression failures.
- Keep a privacy-request register with identity verification, receipt date, response deadline,
  decision, deletion/export evidence, and appeal outcome where applicable.
- Document the backup deletion window and make sure production behavior matches the Privacy Policy.
- Maintain an incident-response plan, vendor contact list, breach-notification decision log, and
  access review for administrators who can inspect private content.
- Re-run legal review whenever the product begins collecting new sensitive data, adds a new AI or
  analytics provider, changes retention, launches paid plans, or targets a new country or state.

## Verification before each release

- New email and Google signups cannot complete without an unchecked, affirmative 18+ Terms and
  Privacy acceptance.
- The database records current document versions, timestamp, acceptance source, hashed network
  evidence, and user agent.
- Analytics and interaction tracking do not run before the user opts in, and tracked URLs exclude
  query strings.
- Disconnecting an integration revokes the Google grant when possible, deletes stored provider
  tokens, clears token-bearing sessions, and requires reauthentication.
- Broadcast recipient queries exclude `marketing_opt_out_at` users.
- Public event pages, RSVPs, signup forms, and access-code behavior match the disclosures.
