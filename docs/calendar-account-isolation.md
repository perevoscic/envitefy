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

September 10, 2026: Calendar settings display a **Synced account** email beneath
each connected Google or Outlook provider. The optional
`/api/calendars?includeAccounts=1` response resolves Google's profile email or the
Outlook default calendar owner's address using the saved calendar credential,
never the Envitefy login email. Existing connections work without a migration or
additional permission request. Other consumers retain the lightweight boolean
response. Email lookup failures leave connection status intact, and Settings can
retry with Refresh. Lookups are briefly cached by credential digest and recheck
stored tokens before responding so disconnects and reconnects cannot expose an
old account email. Coverage: `src/lib/calendar-account-email.test.mjs`.

## Default calendar controls

Connected Google and Outlook tiles contain a Default calendar switch. Changes
save immediately; only one provider can be the default, and turning its switch
off clears the preference. Failed saves retain the previous selection. The
separate default picker and Save button have been removed. Apple subscriptions
continue independently of this destination preference.
