# Calendar account isolation

September 8, 2026

Google sign-in previously saved its refresh token into `oauth_tokens`, even when
the token granted only identity permissions. Settings treated any stored token as
a calendar connection, so signing in after a disconnect could show “Connected”
again or overwrite a connection to a different Google address.

The fix keeps sign-in credentials out of calendar storage and session JWTs.
Calendar status, default selection, event writes, and automatic Google sync check
the stored credential's Calendar event permission. Legacy identity-only records
are treated as disconnected without deleting records or revoking Google access.
Permission checks briefly cache by token digest; every use still checks account
storage so disconnect overrides the cache. Temporary verification failures are
reported as failures and do not clear a saved calendar default.

Google and Outlook connection attempts now require an Envitefy session. Encrypted
OAuth state carries the initiating account ID and email, provider, return payload,
and a nonce with a ten-minute expiry. Callbacks verify both that state and a
temporary HttpOnly cookie before exchanging credentials. Switching accounts,
missing cookies, tampered state, or expired attempts cannot attach credentials.
Callbacks use only the newly returned token and clear the old browser-wide token
cookies. Disconnect also clears the pending connection cookie.

Calendar Settings disconnect deletes only that Envitefy account's provider tokens.
It does not revoke the Google account's project-wide authorization, which could
invalidate another Envitefy account's connection to the same Google account.
The existing all-provider disconnect endpoint retains its revocation behavior.
Token lookup and deletion both use the local user ID, with an email fallback only
for legacy records that have no user ID.

No database migration is required. This change must be deployed before the live
site uses the corrected behavior. OAuth attempts started before deployment must
be restarted from Settings. Calendar sync remains enabled.

Regression coverage: `src/lib/calendar-account-isolation.test.mjs`, the Google and
Outlook connection guards, Settings guards, calendar sync guards, and privacy guards.
The local API smoke check also verified the affected account with the configured
database and Google's permission response without writing events or changing
connection records.
