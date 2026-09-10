# Apple Calendar connection

Calendar settings now offer **Connect Apple Calendar**. It opens subscription
setup with a native `webcal` link and a copyable HTTPS feed link for iPhone, iPad,
or Mac. Users create the private link with Continue and finish by choosing
Subscribe in Apple Calendar. Creating a link alone does not claim a successful
connection: the card changes to Connected after the feed is successfully read.

Settings includes the saved Apple subscription status in its existing
`/api/calendars?includeAccounts=1` response. The Apple card makes no separate
status request on mount, general calendar refresh, or window focus while setup
is closed. Only an open, prepared, unfinished setup checks for the first feed
read. Those checks share one in-flight request, skip hidden tabs, and stop on
connection, dialog close, disconnect, or account change. Ordinary calendar-status
consumers do not query Apple subscriptions. Status checks read Envitefy's database;
they do not contact Apple.

The feed contains the account's saved event records, including received invites
saved by scanning. It excludes drafts, archived/cancelled/deleted events, and
events without a usable date. Dates use the event's time zone, event IDs stay
stable across refreshes, and event edits appear when Apple refreshes its
subscription. Shared events not saved to this account are outside this feed.
This is a subscription; it does not grant Envitefy access to an iCloud account or
send edits from Apple back to Envitefy. No Apple password or additional OAuth
permission is requested. Existing per-event Apple/ICS downloads remain available.

Management at `/api/calendars/apple` requires the signed-in account. Continue
creates an unguessable 256-bit subscription token; public feed access requires
that token. Treat the URL as a credential and never log or share it. Reopening
setup keeps the current token stable. Disconnect revokes it; reconnecting creates
a different token. The all-provider privacy disconnect also revokes the feed,
and deleting the account cascades to its subscription record. Users can remove
the subscribed calendar from Apple Calendar to remove its displayed entries.

`prisma/manual_sql/apple_calendar_subscriptions.sql` records the schema. The table
is also created on first explicit setup; status reads do not create records or
tables. Deployment is required for Apple devices to reach the new feed URL.

Validation: `src/lib/apple-calendar-subscription.test.mjs` exercises account
isolation, revocation, stable links and UIDs, setup status, failure handling,
time zones, all-day dates, draft exclusion, and ICS text escaping.
