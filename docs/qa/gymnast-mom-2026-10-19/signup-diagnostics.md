# Signup diagnostics — October 19, 2026

This audit supports a first-time gymnastics parent's signup journey. No application files were changed by these diagnostics.

## Reproduce the isolated validation findings

From the repository root, run:

```sh
node docs/qa/gymnast-mom-2026-10-19/signup-handler-diagnostics.mjs --write
```

The script transpiles the actual signup POST handler and real signup-intent helpers. It mocks account persistence, successful legal verification and owner notifications, forbids network access, and uses synthetic `.test` addresses. It creates no accounts and sends no emails. `--write` refreshes `signup-handler-evidence.json`; omitting it only prints JSON.

Observed isolated results:

| Input | HTTP status | Reaches mocked account insertion |
| --- | --- | --- |
| Valid email and longer password | 200 | Yes |
| Valid email and one-character password | 200 | Yes |
| Malformed email and longer password | 200 | Yes |
| Empty email | 400 | No |
| Empty password | 400 | No |

The API checks only whether email/password are truthy (`src/app/api/auth/signup/route.ts:84–108`). The browser form has native `type="email"` validation, but the server does not validate email format. The password input has no minimum length (`src/components/auth/SignupForm.tsx:324–334`), and the database helper hashes the supplied password without a minimum (`src/lib/db.ts:1312–1315`, `1346–1349`). This is a source/isolated-handler finding, not evidence that these inputs were submitted to production. The script asserts the observed status codes so a future behavior change prompts evidence review; those assertions do not define the desired password policy.

## Observed local runtime blocker

During the localhost:3000 browser journey, the submit button remained **Creating…** for over five minutes. The preceding legal-acceptance request completed in about 21.9 seconds and signup-source in about 4.6 seconds; no account-signup handler trace had appeared at the diagnostic handoff. A separate `/api/auth/session` read timed out after 15 seconds. The existing development server was under heavy CPU/memory load. At inspection, `.next-dev/server/app/api/auth/signup/route.js` was absent while the legal-acceptance, signup-source and NextAuth bundles existed.

These observations are consistent with a request waiting for development compilation, but do not conclusively prove its root cause. The signup and NextAuth source import graphs did not reach `chrono-node`; all-locale compilation visible elsewhere was therefore not attributed to a direct auth dependency. The development reCAPTCHA enable flag was absent, and the hook returns `null` immediately when unconfigured for development (`src/hooks/useRecaptcha.ts:20–22`, `128`, `172`). No production signup outage was established. Account creation and later meet-upload testing must be reported separately from this local runtime interruption.

## Confirmed recovery and latency risks

- **Indefinite submit state:** the legal-acceptance, signup-source and account-signup requests have no abort signal or application timeout (`src/components/auth/SignupForm.tsx:80–125`, `158–171`). Credential sign-in is also awaited (`186–191`). `submitting` clears only when the chain reaches `finally` (`208–209`), so stalled work leaves the form disabled without a timeout recovery action. This code explains the indefinite UI state, independently of why the local server stalled.
- **Owner email delays the account response:** the signup route inserts the account and then awaits `notifyNewAccountSignup` before returning success (`src/app/api/auth/signup/route.ts:155–173`). The notification helper catches delivery failures, but still awaits SMTP (`src/lib/new-account-notification.ts:105–115`). SMTP has DNS/connection/greeting/socket timeouts of 10/15/10/20 seconds (`src/lib/mail-transport.ts:59–62`). A slow notification can delay the response after an account already exists; retrying can then report an existing account. This is a code-confirmed ordering/latency risk, not a reproduced SMTP incident or the established cause of the local compiler stall.

## Mobile and other checks

At 390×667, Close was visible at y=8. At 390×568, the actual signup dialog placed Close at y=-41.17 through y=2.83, leaving almost the entire 44px control above the viewport. The title was also clipped. See `signup-close-clipped-390x568.png`. The fixed flex container uses vertical centering with overflow scrolling (`AuthModal.tsx:120`); use safe centering or top alignment when the card exceeds the viewport.

The live synthetic account subsequently succeeded on the isolated localhost:3101 server, and two real meet PDFs reached editors and were explicitly saved as private drafts. The earlier local compiler stall did not prevent eventual signup.

The focused onboarding, signup-source and discovery-authorization suites passed 28 tests:

```sh
node --test src/lib/signup-onboarding.test.mjs src/app/api/auth/signup-source/route.test.mjs src/lib/discovery/creation-authorization.test.mjs
```
