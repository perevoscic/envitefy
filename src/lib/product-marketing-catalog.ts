import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
/**
 * Customer-facing Envitefy product truth for marketing and sales copy.
 *
 * MAINTENANCE CONTRACT:
 * - Add every launched customer-facing capability here in the same change that launches it.
 * - Update an existing entry when its behavior, audience, or availability changes.
 * - Do not add admin-only, disabled, experimental, or unverified capabilities.
 *
 * The admin email generator imports this catalog directly, so catalog updates are
 * automatically included in the email marketing team's LLM prompt.
 */

export type EnvitefyMarketingAvailability = "core" | "event-dependent" | "specialized";

export type EnvitefyMarketingFeature = {
  id: string;
  name: string;
  availability: EnvitefyMarketingAvailability;
  customerPromise: string;
  proofPoints: readonly string[];
  sellWhen: readonly string[];
};

export type EnvitefyMarketingFeatureGroup = {
  id: string;
  name: string;
  features: readonly EnvitefyMarketingFeature[];
};

export const ENVITEFY_PRODUCT_MARKETING_CATALOG = {
  positioning: {
    mission:
      "Help hosts, families, teams, and guests turn scattered event information into one useful event experience they can find and act on.",
    primaryMessage:
      "Envitefy turns invitations, flyers, screenshots, schedules, PDFs, event images, or a host's own words into a polished, saved event home with the right guest actions in one shareable link.",
    differentiation:
      "Envitefy does not stop at making a digital copy or extracting text. It creates a durable live event page that can connect details, responses, calendars, directions, registries, sign-ups, and updates.",
    customerPayoff:
      "Fewer lost invitations, fewer repeated questions, less fridge and message-thread clutter, and one current place for everyone to return to.",
  },

  audiences: [
    "hosts and event owners",
    "parents and family organizers",
    "people saving invitations they received",
    "wedding couples and planners",
    "teachers, room parents, and school groups",
    "coaches, team managers, clubs, and sports families",
    "volunteer, community, church, and workplace organizers",
    "guests who need fast access without another app or account",
  ] as const,

  featureGroups: [
    {
      id: "account-control",
      name: "Account and data control",
      features: [{
        id: "account-deletion-request",
        name: "Account deletion requests",
        availability: "core",
        customerPromise: "Request deletion of your Envitefy account and associated data from Profile or a public page.",
        proofPoints: [
          "Settings → Profile includes an explicit account deletion request form with confirmation.",
          "The public /delete-account page accepts requests without signing in or installing the app, and describes the data scope and retention practices.",
          "Requests are sent to Envitefy support; ownership must be verified before manual processing. Submitting a request does not immediately delete an account.",
        ],
        sellWhen: ["The customer asks how to close an account or request deletion of personal data."],
      }],
    },
    {
      id: "create",
      name: "Create from what the customer already has",
      features: [
        {
          id: "snap-source-import",
          name: "Envitefy Snap",
          availability: "core",
          customerPromise:
            "Photograph or upload existing event material and turn it into an organized, saved event instead of retyping it.",
          proofPoints: [
            "Accepts camera photos and uploads of invitations, flyers, screenshots, schedules, PDFs, and other event images.",
            "Extracts useful details such as title, date, time, place, host information, RSVP details, schedules, and relevant links for review.",
            "Creates a saved event record and polished live event card/page; it is more than OCR or a static scan.",
            "Saved scans keep the original document available in a popup that fits the image, with overlaid controls to download the exact file or share it through supported device sharing. Medical source documents remain owner-only.",
            "Designed flyers and invitations stay in the hero, including while an optional background is generated. Tap the flyer to view or save the original; paperwork and business cards keep a separate Original document tile beneath their generated artwork.",
            "Good to know keeps useful extra instructions and plans, such as what to bring, where to enter or dinner and dancing to follow, while omitting generic reminders and repeated event details.",
            "For recognized paperwork and appointments, unique hero and background artwork can begin while the remaining scan details are processed. Saving reuses that work and opens the event without waiting for the artwork.",
            "Received social invitation cards can be kept with Invited events, while source material for events the customer owns belongs with My events.",
          ],
          sellWhen: [
            "The brief mentions snapping, scanning, photographing, uploading, a printed invitation, flyer, screenshot, schedule, or PDF.",
            "The customer wants to avoid retyping or losing paper and message attachments.",
          ],
        },
        {
          id: "guided-live-card-invite",
          name: "Live Card",
          availability: "core",
          customerPromise:
            "Create an interactive Live Card, then download a JPEG invitation with your event details added to the finished design, ready to share across devices. Available to every signed-in host.",
          proofPoints: [
            "Design immediately shows four general starting ideas in a two-by-two grid on phones and desktop, even before choosing an event type. Selecting an event type switches to four randomized, editable ideas for that category, drawn from 50 ideas in each of 11 categories. Shuffle shows different themes without changing the host's description. Birthday, baby shower, gender reveal and graduation banks balance girl and boy directions; reveal ideas keep both possibilities visible without announcing a result. Choosing an idea fills only the design description and never selects an event type, starts generation or saves progress.",
            "The main card creation entry in the desktop and mobile sidebar opens /live-cards directly, below Snap / Upload.",
            "Three focused steps cover Design, Event details and Review, with no upfront format choice or separate Idea step. Start by choosing the event type and describing colors, theme, mood and artwork, plus an optional reference image. The occasion guides the generated design. Generate & continue opens Event details immediately while artwork generates. Hosts enter their title, wording and logistics during generation; those edits update the Live Card without regenerating the background. Desktop keeps the form beside a persistent artwork preview. On phones, the form uses the full width and Preview Live Card opens a separate full-screen view; closing it returns to the same form and edits. Compact generation progress and retry actions remain available while editing. The editor, Review and expanded previews show only the Live Card. Once the card is ready, Download invitation composes the latest event details on the same background. Review stays disabled until the artwork and required event details are ready. Compact links identify missing information and focus its editable field; optional features only add requirements when enabled.",
            "Hosts enter event information directly, without separate description or revision helpers. Title and guest-message placeholders match the selected event type and remain examples, preserving any wording the host enters. The desktop inline preview contains the Live Card artwork without a separate preview header; expanded previews are available in Review and from the mobile Design and Event details screens. Event edits preserve the shared artwork and stay in memory until an explicit save.",
            "Cards show Share in the upper-left corner and an eye button for a full-screen preview on a dark background. Share stays greyed out until the card is published and current changes are saved. Preview remains available while event details are incomplete and reuses existing artwork; Review prepares the finished title lettering. New cards offer Save draft and Publish directly below the Live Card, including in full-screen Preview and Review on phones. Published cards offer Cancel and Save changes; saving updates the existing live event, and Cancel returns to the owner dashboard with unsaved-progress protection. Publish prepares and publishes the card directly through a full-screen animated progress view showing its current stage. Hosts can cancel preparation and keep editing before saving begins. Specific errors explain what needs attention without losing event details. Hosts can also use the Review step before publishing.",
            "Envitefy automatically corrects invitation grammar, spelling and capitalization before final previews, downloads and publishing, including brand names such as AMC. Corrections preserve event details and newer manual edits without a separate proofreading step.",
            "Hosts enter a venue name or street address. Addresses and local time zones are resolved in the background during final card preparation. Street addresses use direct geocoding without requiring a public venue website; local time zones come from the matched coordinates. A clear match fills the details, including supported spelling corrections; ambiguous matches offer choices. City or ZIP clarification appears only when an address cannot be matched. During Review, OpenAI draws the title and optional opening line into the artwork with expressive lettering suited to the design. Changing logistics reuses the finished title artwork.",
            "When a supplied event date omits the year, current or upcoming months use this year and earlier months use next year. Explicit years take priority across event creation and invitation scans.",
            "Compact Basics, When & Where, RSVP and Registry tabs collect Live Card event details. Enabling RSVP requires a host name and phone number; host email is optional. The optional guest message and additional instructions start collapsed, expand independently and appear in Overview only. Live Cards use frosted white circular guest controls with white icons and labels. Downloading reuses the title artwork and adds local dates and times, locations and enabled RSVP contacts. Available public-card, RSVP and registry links appear as scannable QR codes with short readable links; unpublished cards never receive invented public links.",
            "Overview and Calendar are included, with explicit controls for optional RSVP collection and registry links.",
            "Progress stays in memory until Save draft or Publish. Saved guided cards reopen in the same builder with their artwork and event details.",
            "Publishing opens the owner dashboard, where hosts can finish their public URL and share the invitation. A confirmed location is required before publishing.",
          ],
          sellWhen: [
            "A signed-in host wants to create an invitation or Live Card from an event idea.",
            "The host prefers guided fields and a design preview while preparing guest details.",
            "The host needs a starting design idea for their occasion or wants to explore different themes before generating artwork.",
          ],
        },
        {
          id: "envitefy-concierge",
          name: "Envitefy Create",
          availability: "core",
          customerPromise:
            "Turn a plain-language event idea into an editable invitation and guest-ready live page without starting from a blank form.",
          proofPoints: [
            "Chat creation remains accessible through existing /chat links and saved conversations. The sidebar's main card creation entry is now the guided Live Card builder.",
            "Starts from the host's words or uploaded context and helps collect missing event details.",
            "The public /envitefy-create page explains message and upload creation, preview and publishing steps, and example prompts; Live Card attribution links lead here, with signup and login continuing into /chat.",
            "A centered chat composer lets people describe their event directly. Create infers the category and uses its guidance, asking for clarification when needed. Product choices appear before the conversation starts, with Generate now below the latest reply when details are ready. Selecting Live Card or Event Page enables the + upload button: attach your own flyer, add instructions, then Send.",
            "Requests for sign-up forms open a path to the separate sign-up template gallery through a clickable chat reply. Asking preserves the current event and artwork; leaving still uses the existing unsaved-progress choices.",
            "Prefills names, age, venue, theme, and RSVP contacts from messages containing several details, and keeps those facts through follow-up replies. An explicit RSVP contact instruction resolves the RSVP choice without asking again, while respecting an explicit off choice.",
            "Drafts event-specific guest copy and a polished live page for the host to review and edit before sharing.",
            "Hosts can review saved event details, correct titles and format choices in conversation, and generate a draft preview before a separate publish step.",
            "Hosts choose when to save conversation progress and generated artwork. Leaving with unsaved changes offers Save and leave, Discard and leave, or Keep editing; saved drafts reopen with the same artwork.",
            "Artwork previews appear during supported image generation, with status updates for drawing, checking, refining, and saving. Hosts review the completed draft before publishing.",
            "For newly generated Live Cards with headline-only artwork, date, time, location, and RSVP changes update the event details while keeping the image. Changes to printed wording or the visual design still regenerate artwork.",
            "Artwork edits recognize subject-removal and headline-font requests, including common typing mistakes, and check that requested visual changes were applied. Each artwork action allows one initial image attempt and at most one automatic repair; opening a preview or publishing reuses the saved image.",
            "Hosts can preview an invitation while optional styling and RSVP details are unfinished; publishing checks the required event facts separately.",
            "Hosts can review draft previews before publishing while continuing edits in Envitefy Create. Event pages offer fullscreen device previews; Live Cards and flyers/invitations open in an artwork-sized dialog without device controls. Live-card previews include tappable overview, directions, calendar, and configured RSVP or gift-list actions. Hosts can try the RSVP form without submitting a guest response.",
            "Hosts can ask for planning suggestions and invitation wording before every detail is decided, and choose to collect guest replies themselves.",
            "A saved host brief keeps budget, language, accessibility, dietary and privacy preferences available throughout the conversation. Hosts can review and correct those planning notes.",
            "Simple English and Spanish invitation drafts can use TBC details; interrupted tailored replies can be retried using the latest saved event details.",
            "Chat-created RSVP supports guest name, email, and yes/no/maybe responses alongside calendar, directions, and registry links. Specialized household and sign-up flows use their own builders.",
          ],
          sellWhen: [
            "The brief says create, plan, draft, write, or build an invitation/event from an idea or description.",
            "The host wants a guided starting point instead of a blank form.",
            "A guest discovers Envitefy through a shared Live Card and wants to understand how to create their own.",
          ],
        },
        {
          id: "templates-manual-studio",
          name: "Public templates and guest customization",
          availability: "core",
          customerPromise:
            "Browse real templates and make an invitation your own before creating an account; sign in when you want to save and keep editing.",
          proofPoints: [
            "Template and manual creation remain available alongside Envitefy Snap and Envitefy Create.",
            "Create Event → General Events offers Event Page templates for gatherings and meetups. Choosing a design opens the page editor with that template, where hosts add details and optional RSVP before explicitly saving or publishing.",
            "Public landing pages and searchable template galleries cover weddings, birthdays, anniversaries, baby showers, bridal showers, gender reveals, gymnastics, sports, and signup forms.",
            "Visitors can edit manual details and preview their own photos without automatically creating drafts. Leaving an event editor with unsaved changes prompts them to save, discard, or keep editing. Explicitly saved browser drafts remain available for seven days.",
            "Save and continue opens signup or login. Account saves create a private draft that the owner can reopen from My events and Continue creating; publishing is a separate action.",
            "Every full category gallery offers Create with Envitefy: describe an event page, add an optional reference image, preview or refine the custom design, then open its editor. Sign-up Forms keeps its own form generator behind the same callout. Designs stay in memory until Save draft or Publish, and saved changes to a live custom event page stay private until published.",
            "Create with Envitefy entries have distinct category headlines, icons, colors and dialog examples. Category-specific palette, typography and imagery guidance reaches both design planning and artwork generation; the host’s description, reference image and existing design take priority over defaults. Gallery filters do not change the brief.",
            "Sign-up Forms and General Events include 259 original photographic holiday and seasonal designs across 26 collections, including all 11 nationwide U.S. federal holidays, Halloween, corn mazes, trunk-or-treat, summer camps, Easter, Indigenous Peoples’ Day and Día de los Muertos. Twenty-five collections have 10 designs each; Día de los Muertos has nine. Designs vary in artwork, layouts, colors and typography.",
            "Full galleries promote a mix of current and upcoming seasonal designs using the visitor’s local date and a 90-day planning window. Holiday/occasion filters and Original order keep the complete catalog available. Featured landing collections keep their curated presentation, and browsing never changes an event’s dates or saves a draft.",
            "Full category galleries have occasion-specific illustrated headers and coordinated pastel page backgrounds: light green football fields, lavender gymnastics apparatus, warm yellow birthday celebrations, champagne wedding botanicals, blush anniversary ribbons, baby-shower clouds and reveal balloons. The category color continues through the gallery and navigation, with readable titles, responsive artwork on phones and white shells around each template's own design.",
            "Hosts can choose event-specific layouts, edit wording and details, and review the guest experience before publishing.",
            "Event-page previews offer desktop, iPad/tablet, and mobile device icons to check responsive layouts before sharing. The controls are available in owner previews and Envitefy Create, with Close returning to the workspace. Selecting Mobile on a phone fills the browser at its natural size, without shrinking the content into a device frame. Content scrolls underneath the floating device and Close controls without a reserved toolbar band. Event previews extend one continuous event background across the screen with a transparent device toolbar, without restarting the artwork at the preview edges.",
            "Opening an owned Live Card or flyer/invitation from My Events goes directly to its Design editor. Artwork previews keep the card's own proportions without device controls. Event pages open with floating device and sharing controls over the event. On phones, the device selector stays centered and a circular three-dot control opens labeled Preview, Edit, Share and Delete actions. Templates with their own mobile Edit action keep it beside their guest controls. Desktop event toolbars keep their visible actions. Back to preview returns to the full event view with its background and controls, preserving the save-or-discard choice for unsaved edits. Mobile fills the phone at native size without an outer border. The event's own background color continues behind top navigation and through safe areas in both the event view and editor. The collapsible sidebar and guest-response dashboards remain available; deletion returns to My Events.",
            "Generated Live Cards combine the subject, headline, names, and supplied milestone in full-canvas artwork. Create previews place guest actions above the artwork so the full image stays visible; owner-workspace previews and shared guest cards keep the action buttons overlaid on the image, with addresses, schedules, and contact information in the detail panels.",
            "Live Cards have a fine gradient border and soft surrounding glow that follow the colors of their artwork in previews and shared cards.",
            "On phones, the owner workspace shows an artwork thumbnail and View Live Card below the title. Hosts can tap or swipe left to open the full-screen card, then swipe right or close it to return to the same workspace tab, scroll position and edits. A first-visit card-edge hint introduces the gesture; reduced-motion preferences are respected and visible buttons remain available.",
            "Live Card Overview explains the meeting place and time and planned stops in readable sentences, including a movie title when supplied in the guest details, with the host's useful instructions kept alongside the plan.",
            "Owners can edit or remove a Live Card's Registry button link directly in Design and save without regenerating the artwork. Edit all details opens the event's full editor; unsaved changes offer save, discard, or keep editing.",
          ],
          sellWhen: [
            "A visitor wants to try an actual design and enter event details before registering.",
            "The customer wants creative control, a specific theme, or a known event structure.",
            "A host wants to check the guest-facing card while managing responses from a phone.",
            "The brief is about designing a new invitation rather than importing an existing one.",
          ],
        },
        {
          id: "saved-event-workspace",
          name: "Saved My events and Invited events",
          availability: "core",
          customerPromise:
            "Keep events organized by whether the customer is hosting them or received the invitation, and reopen them later.",
          proofPoints: [
            "My events holds events the customer creates and owns, including uploaded source material used to author an event.",
            "Invited events holds classic received-invitation cases such as birthdays, weddings, gender reveals, and similar social invite cards.",
            "Saved events keep important details and actions available after the original paper, screenshot, or message is hard to find.",
            "Desktop navigation can collapse into a compact icon rail, expand on hover or keyboard focus, or stay open with a remembered pin preference. The Envitefy icon marks the rail, and the wordmark appears when expanded; phones keep a full navigation drawer.",
            "Dark event designs automatically use stronger light frost and clearer purple navigation labels in the sidebar; light designs retain their translucent appearance.",
            "Drafts sits directly below My Events in the sidebar, with a count and links to resume saved event, signup form, and Envitefy Create drafts in their editors.",
            "The sidebar lists upcoming events across categories from nearest to latest, with a category icon beside each event and subtle month-and-year dividers. Undated entries follow dated events under Draft, with Draft beneath each title, and past events expand separately with the most recent first.",
          ],
          sellWhen: [
            "The pain point is lost invitations, scattered screenshots, fridge clutter, or remembering whether the customer is hosting or attending.",
            "The customer wants to find saved work and continue creating an event later.",
          ],
        },
        {
          id: "home-planning-dashboard",
          name: "Personal event planning dashboard",
          availability: "core",
          customerPromise:
            "See what is next, pick up unfinished events, and act on invitations and planning gaps from one home dashboard.",
          proofPoints: [
            "Shows upcoming event counts for the next 7 and 30 days, with the original image-led event cards. Left-aligned All, My events, and Invited events filters show count bubbles for the complete card list below the spotlight.",
            "The Games view lists individual upcoming games from saved schedules in date order, including seasons without one primary event date. The same matchup and date from multiple saved schedules appears once, with available details combined and distinct kickoff times preserved. Cards show the game without repeating the source schedule heading; the matchup links to its event page and keeps available calendar, away-game directions and ticket actions. Completed games, bye weeks and undated fixtures stay out of the upcoming list.",
            "Separate compact Schedule conflicts and Needs attention tiles count overlapping event times and invitation or event-detail actions. Each opens the relevant details and event links; drafts and declined invitations stay out of the active agenda.",
            "Resume recent saved event drafts, including drafts without a date, in the appropriate editor.",
            "Enabled hosted sign-up forms show confirmed filled spots, remaining capacity, and section-level needs; waitlisted and canceled claims do not fill spots.",
            "The highlighted event presents Venue, Drive, and Weather in three responsive tiles, with directions, total route mileage, estimated drive time in hours and minutes, and an available event forecast. Drive estimates load automatically from an available profile location, recent saved location, or browser location already allowed by the user, including for events more than 3 days away. A clear Use my location prompt explains the drive estimate and requests browser permission when needed; it also lets users update a saved or home-based estimate from their current location.",
          ],
          sellWhen: [
            "Families or hosts need one place to check upcoming plans, unfinished invitations, and volunteer or potluck needs.",
            "Sell weather, travel, response tracking, and sign-up summaries only when the event has the required details and enabled features.",
          ],
        },
        {
          id: "envitefy-social-profiles",
          name: "Follow Envitefy",
          availability: "core",
          customerPromise:
            "Find Envitefy's social profiles directly from the website or your account navigation.",
          proofPoints: [
            "Signed-out site footers link to Envitefy on Instagram, Facebook, YouTube, TikTok, and Reddit.",
            "Signed-in users can find the same links in the sidebar profile menu on desktop and mobile.",
            "Email footers and event pages with social links reuse the same five profiles and email icon assets.",
            "Social links open in a new tab so customers can keep their place in Envitefy.",
          ],
          sellWhen: [
            "Invite customers to follow Envitefy or show them where to find the brand's social profiles.",
          ],
        },
      ],
    },
    {
      id: "live-experience",
      name: "One live event home for guests",
      features: [
        {
          id: "hosted-live-pages",
          name: "Hosted live event pages and cards",
          availability: "core",
          customerPromise:
            "Give guests one polished, mobile-friendly event home instead of a static flyer or a chain of follow-up messages.",
          proofPoints: [
            "Public event pages open in phone and desktop browsers.",
            "Displayed phone numbers, emails, and addresses in scanned event facts and shared detail sections link directly to calling, email, and maps.",
            "Guests do not need to install an app or create an account just to use a shared event page.",
            "The page keeps the latest event details and available actions together.",
            "Owners can open the current saved card or event from a labeled workspace action, then return to editing. Proposed card changes have a separate view before saving.",
          ],
          sellWhen: [
            "The brief mentions a live card, event site, invitation page, mobile experience, or one place for guests.",
          ],
        },
        {
          id: "standalone-invitation-exports",
          name: "Downloadable digital and printable invitations",
          availability: "event-dependent",
          customerPromise:
            "Download an invitation image that includes the event wording and supplied guest details.",
          proofPoints: [
            "Digital invitation exports integrate supplied names, wording, date, time, venue and address into the complete artwork, preserving its composition and designed lettering.",
            "Printable flyer exports use a 5-by-7-inch PNG at 300 DPI with safe text margins.",
            "Artwork checks compare visible wording with approved event details and inspect readability, framing, and adherence to the requested style. Failed checks receive one targeted repair; unavailable verification is disclosed for host review.",
          ],
          sellWhen: [
            "The host wants a self-contained invitation image to share or a printable 5-by-7 invitation.",
          ],
        },
        {
          id: "one-link-sharing-updates",
          name: "One-link sharing and live updates",
          availability: "core",
          customerPromise:
            "Share one reusable link by text, email, native share, or copy-link and update the source instead of resending the invitation.",
          proofPoints: [
            "Guests can return to the same link for the current details.",
            "Hosts can change event details after sharing so the live page remains the current reference.",
            "Share actions are available from live cards and public event pages.",
          ],
          sellWhen: [
            "The customer is tired of repeating changes or searching group texts and email chains.",
            "The campaign emphasizes easy sharing, current information, or fewer guest questions.",
          ],
        },
        {
          id: "event-details-schedules",
          name: "Event details, schedules, and multi-part itineraries",
          availability: "event-dependent",
          customerPromise:
            "Organize dates, times, time zones, venues, host notes, dress guidance, schedules, and multi-part event information in one readable place.",
          proofPoints: [
            "Supports ordinary single events as well as schedules, multi-session sports meets, and multi-event wedding weekends.",
            "Event-specific pages can include arrival, parking, drop-off, pickup, rain-plan, admission, travel, or other logistics.",
            "Gymnastics discovery can collect organizer-listed hotels from event pages or PDF links, keeping published rates, booking deadlines, phone instructions, and original reservation links together when available.",
            "Hosts can update the details without changing the shared link.",
          ],
          sellWhen: [
            "The event has more detail than fits comfortably on a paper card or requires a schedule or itinerary.",
            "Families traveling to a gymnastics meet need the organizer's accommodation details and booking links in the event page.",
          ],
        },
        {
          id: "calendar-saves",
          name: "Calendar saves",
          availability: "core",
          customerPromise:
            "Let guests save the event instead of relying on the invitation to remember it.",
          proofPoints: [
            "Live pages support Google Calendar, Apple Calendar/ICS, and Outlook calendar actions.",
            "Live Cards interpret times without a timezone in the guest's local browser timezone; calendar links preserve the resolved date and time across Google, Apple, and Outlook.",
            ...(CONNECTED_CALENDAR_SYNC_ENABLED
              ? [
                  "Signed-in owners can connect or disconnect Google Calendar and Outlook background sync from Settings; Apple Calendar uses a one-event ICS handoff.",
                  "Saved scans and uploads can automatically sync to a connected Google or Outlook calendar using the owner's calendar preference.",
                  "Owners receive brief calendar-sync toasts with access to Calendar settings while the saved event stays visible.",
                ]
              : [
                  "Guests can manually save events with calendar links or ICS downloads; these actions do not require a connected calendar account.",
                ]),
            "Calendar entries can carry event timing, location, and available reminder information.",
            "Calendar descriptions omit repeated event fields and category labels while keeping useful notes and contact details; automatically synced entries include a link back to Envitefy.",
            "Medical appointment calendar saves organize patient, clinician, provider, phone and fax details into readable lines, leaving the raw scan transcript and date of birth out of the description.",
            "Specialized schedule flows can expose the relevant event or session timing.",
          ],
          sellWhen: [
            "The brief mentions remembering the date, avoiding missed events, schedules, or replacing a paper reminder.",
          ],
        },
        {
          id: "maps-directions",
          name: "Maps and directions",
          availability: "event-dependent",
          customerPromise:
            "Put the venue and directions beside the event details so guests know where to go.",
          proofPoints: [
            "Public event experiences can open map directions from the event location.",
            "Pages can keep venue, parking, arrival, and location notes together.",
          ],
          sellWhen: [
            "The event has an in-person venue, parking instructions, multiple locations, or unfamiliar guests.",
          ],
        },
        {
          id: "event-access-codes",
          name: "Optional event access codes",
          availability: "event-dependent",
          customerPromise:
            "Add a passcode gate when a host wants a shared event page to require an extra access step.",
          proofPoints: [
            "Per-event access-code protection is available for supported event pages.",
            "Authorized guests can continue into the event and RSVP experience after unlocking it.",
          ],
          sellWhen: [
            "The client explicitly asks about a private, protected, or passcode-gated event page.",
          ],
        },
      ],
    },
    {
      id: "rsvp",
      name: "RSVP and guest coordination",
      features: [
        {
          id: "rsvp-responses",
          name: "Guest RSVP from the live page",
          availability: "event-dependent",
          customerPromise:
            "Collect attendance where guests already read the invitation instead of sending them to a disconnected form.",
          proofPoints: [
            "Supported events can collect yes, maybe, and no responses from the public event page.",
            "Guests can respond without installing an app.",
            "RSVP deadlines, contact details, and guest messages can stay connected to the event.",
            "Hosts receive an email when a guest saves a new or changed Yes, Maybe or No RSVP, with guest details and a link to their RSVP dashboard. Declined guests receive no confirmation email.",
          ],
          sellWhen: ["The host needs attendance, a headcount, guest replies, or an RSVP deadline."],
        },
        {
          id: "rsvp-households-headcount",
          name: "Household and party headcounts",
          availability: "event-dependent",
          customerPromise: "Plan from real attendance totals, not one name per household.",
          proofPoints: [
            "Supported RSVP flows can collect plus-ones, household members, adult counts, kid counts, and sibling attendance.",
            "Birthday experiences can keep family counts, total party headcount, capacity, and pending households visible.",
            "Hosts can use the result for food, seating, space, and activity planning.",
          ],
          sellWhen: [
            "The event serves families, allows plus-ones, has capacity limits, or needs an accurate food/space count.",
          ],
        },
        {
          id: "rsvp-questions-notes",
          name: "Event-specific RSVP questions and notes",
          availability: "event-dependent",
          customerPromise:
            "Collect the details the host needs with the response instead of chasing answers later.",
          proofPoints: [
            "Supported flows can collect guest messages, custom answers, allergy notes, dietary needs, meal preferences, and host-relevant notes.",
            "Wedding flows can support meal selections and dietary tracking.",
            "Gender reveal flows can connect Team Pink or Team Blue guesses to the guest response.",
            "Team and meet flows can use attendance responses for athlete availability.",
          ],
          sellWhen: [
            "The host needs food, allergy, meal, prediction, availability, pickup, or other event-specific information.",
          ],
        },
        {
          id: "rsvp-host-dashboard",
          name: "Live host RSVP tracking",
          availability: "event-dependent",
          customerPromise:
            "See who replied, who is coming, and who still needs follow-up without maintaining a separate spreadsheet.",
          proofPoints: [
            "Host views can organize yes, maybe, no, pending, response counts, recent replies, and guest details.",
            "Supported event dashboards expose headcounts and RSVP progress with the event.",
            "Owners can edit the RSVP host name, phone and email directly in the RSVP workspace, with explicit Save and Cancel controls.",
            "Specialized pages can keep guest messages, meal information, allergy notes, or other answers with each response.",
            "From Messages, event owners can write, preview and explicitly email announcements to guests whose current RSVP is Yes or Maybe, with saved drafts, recipient history and failure retries. Event or artwork edits never trigger these emails. Declined guests receive neither these updates nor RSVP confirmation emails.",
          ],
          sellWhen: [
            "The campaign is for hosts, planners, parents, or organizers who need visibility after sending the invitation.",
          ],
        },
        {
          id: "rsvp-specialized-flows",
          name: "Specialized RSVP experiences",
          availability: "specialized",
          customerPromise:
            "Match the response flow to the event instead of forcing every host into the same generic form.",
          proofPoints: [
            "Wedding weekends can collect responses across ceremony, reception, rehearsal, welcome events, or brunch where configured.",
            "Birthday flows can collect kids, adults, allergies, and household counts.",
            "Gender reveals can collect attendance and optional reveal guesses.",
            "Sports and gymnastics flows can track family responses or athlete availability.",
          ],
          sellWhen: [
            "The client names one of these event types or asks for a tailored guest-response flow.",
          ],
        },
      ],
    },
    {
      id: "coordination",
      name: "Registries, sign-ups, reminders, and guest actions",
      features: [
        {
          id: "registries-gifts",
          name: "Registry, gift, wishlist, and fund links",
          availability: "event-dependent",
          customerPromise:
            "Keep gift information beside the invitation so guests do not have to ask for or search for it.",
          proofPoints: [
            "Supported events can show major registry providers and custom registry, wishlist, gift, or fund links.",
            "Wedding, birthday, baby shower, bridal shower, and gender reveal experiences can use event-appropriate gift language.",
            "Some registry experiences support item quantities or claims; market that only when the selected flow includes it.",
          ],
          sellWhen: [
            "The brief mentions gifts, a registry, wishlist, honeymoon fund, cash fund, or gift notes.",
          ],
        },
        {
          id: "smart-signups",
          name: "Smart sign-up forms",
          availability: "core",
          customerPromise:
            "Coordinate volunteers, food, supplies, shifts, and other needs from a live public form instead of cleaning up a spreadsheet.",
          proofPoints: [
            "Supports volunteer roles, potlucks, food stations, team snacks, classroom needs, fundraisers, supplies, and custom sign-up structures.",
            "Create Event offers the account's enabled event categories and Sign-up Form. The Sign-up Forms sidebar collection appears after the first published form, or immediately for people who joined for forms; explicitly saved drafts remain in Drafts.",
            "New accounts created from the signup forms category default to Sign-up Form creation, with the template gallery as their starting point. Existing account preferences are preserved.",
            "Signed-in organizers keep their account's sidebar and mobile menu throughout the signup template gallery and editor, with Save, Discard, or Keep editing when leaving unsaved work.",
            "Published signup pages keep Edit, Duplicate and Delete at the top right for owners. On phones, Calendar, Directions and Share fit in one row with icons and accessible touch targets.",
            "The signup builder has compact Back, Start over and Save as draft controls, side-by-side mobile preview actions, and a desktop Cancel action. Sharing lives in the builder; published forms provide their guest link and drafts explain when it becomes available. Duplicate event opens an unsaved copy of the design and content without participants. Moving the event start keeps its existing duration, and date errors link to the editable field.",
            "Organizers can create sections and slots with labels, quantities, capacity, time windows, and notes.",
            "Signup headers have pencil controls beside the title, welcome, group, organizer, date and location. Edits stay on the chosen design, with Done and Cancel controls. Section handles support pointer, touch and keyboard reordering, with move buttons as an alternative.",
            "Choose a design, then build a form with registration places, volunteer roles, items to bring, time slots, custom signup sections, and informational text. Click to add or drag sections into place; move buttons also work on phones and keyboards. Sections and slots have explicit edit, duplicate, remove, and Undo controls, with existing signups protected.",
            "Settings can allow multiple slots, limit slots per person, lock full slots, and enable automatic waitlists.",
            "Guests can claim available needs from the shared form without installing an app.",
            "Hosts can see what is claimed, full, waitlisted, or still needed, then edit the live form after sharing.",
            "All 150 signup templates have a distinct curated design across 12 page compositions, with coordinated typography, paper colors, photo framing, and signup rows or cards. Styles include gazettes, menus, botanical invitations, posters, tickets, journals, scrapbooks, and modern studio layouts.",
            "Hosts can keep the original template composition or customize its header, fonts, colors, photos, crops, and spacing. The same saved design appears in the editor, review, and shared signup page.",
            "The shared font library includes 150 locally bundled typefaces. Sign-up forms and custom Event Pages have a searchable All 150 fonts collection, with readable body companions and progressively loaded previews. Sign-up forms and custom Event Pages offer 12 additional title-and-content pairings, including romantic, botanical, storybook, vintage, cinematic and modern styles, with searchable previews. Typography changes remain in memory until explicitly saved or published.",
            "All 150 signup designs include original photographic artwork, covering seasonal events, community groups, sports, celebrations, classes, and hobbies.",
            "All 150 signup templates have artwork-focused thumbnails with readable names and coordinated design colors and typography. A new form starts with the selected design and an empty structure, without fictional dates, hosts, questions, or signup slots.",
            "Build form and Preview & publish replace the four-step signup wizard. Optional Design and Settings panels keep the theme and contact rules within reach. Preview lets organizers select slots, answer questions, and try a test submission without sending data or reserving places. Progress is saved only by explicit choice; publishing remains separate.",
            "Publish stays disabled when a sign-up form has no changes since publication and becomes available after an edit. Successful publishing shows the organizer a brief confirmation on the live form.",
            "Public forms let guests sign up without an account and manage their own response from the same browser or a private confirmation-email link. Edit or cancel your signup offers email-first recovery, optional phone lookup that sends to the saved email, a Check your email step, resend and correction actions, and expandable help. Restricted forms retain invitation access; participant contacts stay private.",
          ],
          sellWhen: [
            "The brief mentions volunteers, helpers, potluck items, snacks, supplies, shifts, slots, capacity, or a waitlist.",
          ],
        },
        {
          id: "custom-signup-themes",
          name: "Custom sign-up themes with Envitefy Create",
          availability: "specialized",
          customerPromise:
            "Turn a visual idea into a coordinated sign-up page, then build the form in the same editor.",
          proofPoints: [
            "A focused dialog accepts a design idea, pasted event details and optional reference image. Organizers can reuse their exact artwork or generate a new interpretation of its subject and style, then review a coordinated preview with the event facts and requested signup items they supplied before opening the builder.",
            "Use this theme accepts the preview. Describe a change refines it, while Redesign with Envitefy offers the same flow for existing forms. Closing the dialog leaves the current design, event details, slots, questions, and responses intact.",
            "Custom designs stay in editor memory until explicitly saved. The saved design is preserved when reopening, previewing, and publishing the signup form.",
          ],
          sellWhen: [
            "The organizer wants a unique visual theme for a volunteer day, school activity, gathering, or branded signup that goes beyond the gallery designs.",
          ],
        },
        {
          id: "guest-reminders-updates",
          name: "Guest reminders and updates",
          availability: "event-dependent",
          customerPromise:
            "Keep follow-up communication connected to the event and give guests one place to verify changes.",
          proofPoints: [
            "Event workflows support reminder-friendly follow-up for pending guests and participants.",
            "Hosts can update timing, venue, dress guidance, schedules, drop-off, parking, or other live-page details after sharing.",
            "Available reminder and update tools vary by event workflow and configured contact information.",
          ],
          sellWhen: [
            "The customer needs to follow up with pending guests or communicate a plan change.",
          ],
        },
        {
          id: "guest-action-center",
          name: "Guest action center",
          availability: "event-dependent",
          customerPromise:
            "Put the useful next actions beside the event details so guests can act while the context is in front of them.",
          proofPoints: [
            "Depending on the event, guests can RSVP, save to calendar, open directions, view schedules, visit registries, claim sign-up slots, and share the page.",
            "Template builders can publish optional arrival, parking, accessibility, preparation, and category-specific guest guidance beside the guest actions. Hosts can set an explicit end time or leave it unset.",
            "The same link remains useful before the event and when guests need to reopen details later.",
          ],
          sellWhen: [
            "The brief is about reducing guest friction or combining multiple event links and actions.",
          ],
        },
      ],
    },
    {
      id: "specialized",
      name: "Event-specific experiences",
      features: [
        {
          id: "wedding-suites",
          name: "Wedding websites and invitation suites",
          availability: "specialized",
          customerPromise:
            "Create a wedding website that brings the invitation, itinerary, RSVP, registry, and guest logistics together in one shareable link.",
          proofPoints: [
            "The wedding design gallery includes 60 designs, with filters for style, color, season, and the new collection. Its 20 newest designs each include original generated artwork and a distinct website composition, from illustrated botanicals and destination settings to modern editorial and evening celebrations.",
            "Wedding flows can support multi-event itineraries, RSVP tracking, registry/fund links, maps, travel details, and calendar actions.",
            "Configured wedding experiences can collect meal choices, dietary information, guest messages, and seating-related details.",
            "Wedding hosts can publish arrival, parking, dress code, accessibility, additional-guest, shuttle, and accommodation notes, with an optional explicit event end time.",
            "Guest-list import and direct share-ready delivery are available in supported wedding workflows.",
          ],
          sellWhen: [
            "The brief names a wedding, destination wedding, ceremony/reception, rehearsal, welcome party, or wedding weekend.",
          ],
        },
        {
          id: "family-celebrations",
          name: "Birthdays, anniversaries, showers, gender reveals, and family celebrations",
          availability: "specialized",
          customerPromise:
            "Use guest and logistics tools shaped for family events rather than a generic event page.",
          proofPoints: [
            "Birthday creation includes 120 individually composed designs: the original 24, 56 additional kids themes, and 40 adult birthdays. The latest 26 cover hands-on crafts, sports, gaming, fantasy, animals, food workshops, and cozy gatherings, with original artwork, distinct layouts, and practical sample host notes. The 30 anniversary designs form a separate Anniversaries collection, including 20 new romantic, artisan, botanical, coastal, celestial, retro, and formal styles from cotton to diamond milestones and any year together, with couple names, years together, anniversary wording, photos, registry links, and RSVP features. Each has new generated artwork and an explicit hero layout, supported by locally bundled display fonts and theme-specific party details, notes, photo, and RSVP layouts. Gallery previews render the actual invitation design with distinct sample names, headlines, age-appropriate details, and venues for every birthday design. The full birthday collection is available by default, with progressive loading, a Load more fallback, and heart favorites saved in the current browser with a Favorites filter.",
            "Birthday websites can combine household RSVP, adult/kid counts, allergies, directions, pickup/drop-off, gifts, calendar, and updates.",
            "Birthday hosts can set an explicit end time and add optional drop-off/pickup, sibling, parking/arrival, and food/allergy guidance that appears on the guest invitation.",
            "All 330 birthday, anniversary, wedding, baby-shower and gender-reveal designs carry their artwork theme into content sections through assigned shapes, borders, headings and page compositions. Restrained CSS gradients keep the backgrounds quiet, without added SVG patterns. Existing hero artwork and guest actions remain part of each design.",
            "Birthday invitations integrate calendar saves into the date, directions into the venue, and sharing into each design’s invitation controls. Host guidance uses the theme’s existing notes layout; category-specific Envitefy branding and official social links remain in the footer.",
            "Baby shower creation includes 60 original designs with individually generated artwork, distinct names, compositions, palettes, locally bundled typefaces, and unique sample names, venues, and host notes. Square gallery previews show the same design used by the editor and published invitation. Sell this collection to hosts who want an individual baby shower style, from woodland and coastal to artisan, botanical, playful, and celestial celebrations. Gender reveal creation also opens with a searchable design gallery.",
            "Wedding, birthday, anniversary, baby shower, gender reveal, and gymnastics galleries use consistent square previews of the event layouts, helping hosts compare designs before choosing one.",
            "Baby and bridal shower pages can combine RSVP, registry links, host notes, guest questions, reminders, and maps.",
            "Gender reveals include 60 individually composed designs with original artwork, distinct names, locally loaded typefaces, and matching gallery, editor, and published invitations.",
            "Gender reveal pages can combine RSVP, Team Pink or Team Blue guesses, optional tally behavior, gift links, reminders, and updates.",
          ],
          sellWhen: [
            "The client names a birthday, baby shower, bridal shower, gender reveal, anniversary, housewarming, or similar celebration.",
          ],
        },
        {
          id: "gymnastics-meet-hubs",
          name: "Gymnastics meet discovery and team hubs",
          availability: "specialized",
          customerPromise:
            "Turn dense meet flyers, screenshots, schedules, and PDF packets into a parent-friendly meet information hub.",
          proofPoints: [
            "Gymnastics hosts can resize page sections to full, two-thirds, half, or one-third width and place another existing or new section beside them. Paired sections stack on small screens. Own row and Undo make rearranging reversible, while explicit saves carry the layout into reloads, previews, and guest pages.",
            "Hosts can edit gymnastics page wording in place using pencils beside the title, welcome copy, captions, section headings, navigation labels, detail labels and description. Link captions, RSVP field prompts, response choices, submit captions and confirmation messages are editable too, with pencils beside controls so editing wording does not activate their actions. Done, Cancel and Reset to template wording controls support changes across all 60 designs. Edits stay in memory until explicit save, survive design changes and reloads, and appear without editing controls on guest pages and fullscreen previews.",
            "Choose from 60 gymnastics meet designs with original artwork, distinct names, coordinated typography and layouts, and matching square previews in the gallery and editor.",
            "All event template editors, including gymnastics and signup forms, offer Change image directly on the preview. One click opens the system file chooser, and the selected image immediately updates the preview. Hero image options are removed from the sidebar, with no extra upload or confirmation dialog. Replacements stay in memory until an explicit save.",
            "Hero artwork automatically receives a stronger tint from the selected template's own accent across event categories and signup forms, including uploaded images. A compact Filter on / Filter off switch beside Change image lets people keep their original colors. Changing designs updates the accent while preserving the choice; explicit saves and published pages retain it. Original files stay intact. Drag gymnastics artwork directly up or down or use the compact full-image button, with no adjustment window; explicit saves preserve its fit and position.",
            "Gymnastics creation starts with a searchable meet template gallery. Choosing a design opens it directly in the editor. Hosts can upload a meet packet or paste a public meet link from the Add your details panel, or enter the details manually; the selected layout carries into the draft.",
            "Organizes sessions, levels, warmups, march-in, competition, awards, venues, maps, admission, parking, and coach notes.",
            "Supports calendar actions, parent responses, athlete availability, volunteer needs, and live changes where configured.",
            "Families can use one team link instead of repeatedly searching the original meet packet.",
          ],
          sellWhen: [
            "The brief mentions gymnastics, a meet packet, sessions, rotations, athletes, coaches, team parents, or meet-day updates.",
          ],
        },
        {
          id: "sports-team-schedules",
          name: "Football and sports event experiences",
          availability: "specialized",
          customerPromise:
            "Organize game-day or season information into a shareable team experience for families and participants.",
          proofPoints: [
            "Football hosts can use Place beside to combine two sections in one row. Paired sections share one navigation tab in clean previews and published pages, stack on phones, and preserve their arrangement through explicit saves. Sell this when teams want related schedule, update, or attendance information together.",
            "Football matchups read Away team at Home team when the host is known, such as Pine Forest at Seahawks. Neutral sites and games without a known host use vs. Calendar titles and single-game URL suggestions follow the same order.",
            "Open and bye weeks also appear in Announcements with their schedule date and No game scheduled. Senior Night game notes also create announcements with the date and matchup, and sit beside stadium and official ticket information links on upcoming game cards. These notices follow schedule edits automatically in the editor and published page, while preserving authored announcements and section visibility choices.",
            "Football signup keeps the selected design ready for customization and sets Football as the account's default creation category, available in create settings.",
            "Football season schedules use the team name and a compact school-year title, such as South Walton Seahawks Football '26-'27 Schedule. Generic imported titles update consistently in the editor, explicit saves and published page, while custom headlines and individual game titles stay intact.",
            "Football schedules recognize open and bye weeks as dated no-game notes, excluding them from game counts, matchup cards, calendar actions and travel lookups. Past scores show green Win and red Loss labels when the source provides the result. In South Walton's local schedule, Walton resolves to the Braves in DeFuniak Springs, with verified stadium directions and the school's official GoFan ticket portal; manual venue changes stay intact.",
            "Schedule-only football imports populate the game calendar without generating a redundant Details description. Details uses supplemental text from the source and useful contacts; team, season and stadium facts stay in the hero. Logistics, volunteer notes and explicit announcements stay in their own sections. Empty imported Details sections stay hidden until content is supplied or the host adds the section.",
            "All 90 football designs support pencil editing directly on the page for event titles, hero captions, descriptions, section headings, navigation, card text, attendance explanations and schedule link captions. The editor and published event share section rendering. Cancel and Reset restore wording, guest views hide the pencils, and changes remain in memory until explicit save or publishing.",
            "Every football design carries its theme into its content sections, cards, headings and navigation with individually authored structures. Examples include stitched fabric panels, folded paper cards, newspaper columns, arcade frames, stained-glass arches and stadium field markings. Subtle gradients support each theme while the original hero artwork keeps its colors. The same designs appear in the editor and guest page, with responsive sections and accessible editing controls.",
            "Empty football editors include a themed Start your team schedule guide, a first-matchup outline, and direct actions for game schedules, imports, team details, rosters, and practices. Starter panels and populated page sections have X controls. Removed sections can be restored with their contents intact; layout changes stay in memory until an explicit save or publish and are respected on the published page. Guidance gives new pages a useful starting point without adding sample facts to saved or published events.",
            "Football has a dedicated public page and Create Event sidebar entry. Its searchable design gallery uses responsive masonry cards, automatic loading, and a back-to-top control; All 90 designs have individual football hero artwork, coordinated palettes and typography, and cinematic, poster, editorial, or split hero layouts shared by the gallery, editor, and event page. The collection includes coastal watercolor, mountain and desert fields, winter and rain games, women’s football, youth flag football, homecoming, marching band, tailgate, chrome, linocut, and paper-craft artwork. Thirty additional designs introduce ceramic mosaic, copper, clay, embroidery, risograph, cyanotype, stained glass, terrazzo, origami, velvet, aerial formations, locker rooms, stadium tunnels, riverside fields, industrial neighborhoods, tropical illustration, family games, senior-night traditions, analog collage, patchwork, motion photography, and rooftop football. The gallery and design picker lead with a curated mix of team, heritage, stadium, and illustrated scenes; image-led thumbnails place readable design names directly over a quiet area of each artwork, preserving the original colors, card-relative typography, and intentional photo framing. Headlines are editable from the customization menu, with immediate preview updates. Uploaded team photos remain intact when changing designs. Category editors provide a labelled Change hero image control, including when an image is already selected; images remain in memory until explicit save.",
            "Football builders automatically start importing when a schedule file is selected or a public website URL is pasted, with no extra fill-form button. Typed links can be submitted with Enter. Imports fill the current editor, preserving the selected design and custom hero without creating a draft until explicit save. Game cards show one matchup heading using confirmed team mascots, prominent supplied dates, home/away status, stadium names, away-game directions, individual calendar actions and verified ticket links. Street addresses stay out of the card text while remaining available to directions and calendar entries. The schedule opens on upcoming games, with past results and dates awaiting confirmation in separate accessible tabs. Past game cards show only the matchup, date and supplied score, or Score unavailable when no score was supplied; desktop cards use two columns and mobile cards one. Ticket buttons open the hosting school's official sales page, including Hudl or GoFan where verified, with game selection on school-wide portals. Stadiums and tickets populate before driving calculations, and successful results stay visible if another lookup fails. Away games offer Get directions without a separate drive-summary box. Compact Directions and Calendar buttons share one row in narrow game cards, with full accessible labels and the existing calendar provider chooser or saved default. Near-term weather can be refreshed when verified addresses and configured providers support it. Unprovided details stay hidden. Specialized sports builders structure schedules, team details and attendance information.",
            "Uploaded practice and game schedules have an editable row review before saving or publishing. Quick pages retain weekly groups, games, opponents, locations and notes across the full schedule; dated rows with confirmed start and end times offer calendar actions.",
            "Sport event templates include football, soccer, gymnastics, cheerleading, dance/ballet, and general sport-event paths.",
            "Relevant pages can combine calendar, maps, schedule, updates, RSVP/availability, and volunteer information.",
          ],
          sellWhen: [
            "The brief names a team, sport, game day, season, tournament, practice, performance, or athlete/family audience.",
          ],
        },
        {
          id: "school-community-business-events",
          name: "School, community, real-estate, appointment, and general events",
          availability: "specialized",
          customerPromise:
            "Use the same live-page and coordination foundation for events beyond social invitations.",
          proofPoints: [
            "Supported creation paths include field trips/days, class events, workshops, appointments, open houses, housewarmings, special events, and general events.",
            "The page can emphasize the actions relevant to the event, such as schedule, directions, RSVP, sign-up, calendar, or updates.",
            "Smart sign-ups can coordinate school, church, volunteer, team, community, and workplace needs.",
          ],
          sellWhen: [
            "The client's requested event type falls outside weddings, family celebrations, or sports.",
          ],
        },
      ],
    },
  ] as const satisfies readonly EnvitefyMarketingFeatureGroup[],

  eventTypes: [
    "birthdays",
    "weddings and wedding weekends",
    "baby showers",
    "bridal showers",
    "gender reveals",
    "anniversaries",
    "housewarmings",
    "graduations and open-house celebrations",
    "gymnastics meets",
    "football, game day, soccer, cheerleading, dance/ballet, and other sports events",
    "field trips/days and class events",
    "volunteer, potluck, fundraiser, church, community, and workplace sign-ups",
    "appointments",
    "real-estate open houses",
    "workshops, special events, and custom/general events",
  ] as const,

  sellingRules: [
    "The client's words are the campaign brief. Match the requested audience, event type, benefits, exclusions, and image direction.",
    "Know the complete catalog, but select only the features that solve the stated audience's problem. Never dump every feature into one email.",
    "Lead with the customer's pain and outcome, then use relevant features as proof. Do not write a feature inventory without a benefit.",
    "Use 'core' features broadly. Describe 'event-dependent' or 'specialized' features only when the chosen event/workflow supports them, using language such as 'can' or 'depending on the event' when needed.",
    "Never reduce Envitefy Snap to OCR or describe the result as only a digital copy. Explain the saved live event experience and its useful next actions.",
    "Use 'Envitefy Create' for the product name, 'Create with Envitefy' for creation buttons, and 'Create' in compact navigation. The former Concierge name is retired.",
    "Do not market admin-only, feature-flagged, disabled, experimental, or unverified capabilities as available customer features.",
    "Do not invent pricing, guarantees, delivery channels, integrations, analytics, or capabilities outside this catalog and the client's supplied facts.",
  ] as const,
} as const;

export function listEnvitefyMarketingFeatures(): readonly EnvitefyMarketingFeature[] {
  const features: EnvitefyMarketingFeature[] = [];
  for (const group of ENVITEFY_PRODUCT_MARKETING_CATALOG.featureGroups) {
    features.push(...group.features);
  }
  return features;
}

export function buildEnvitefyMarketingCatalogPrompt(): string {
  return JSON.stringify(ENVITEFY_PRODUCT_MARKETING_CATALOG);
}
