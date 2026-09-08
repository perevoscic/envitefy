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
            "Received social invitation cards can be kept with Invited events, while source material for events the customer owns belongs with My events.",
          ],
          sellWhen: [
            "The brief mentions snapping, scanning, photographing, uploading, a printed invitation, flyer, screenshot, schedule, or PDF.",
            "The customer wants to avoid retyping or losing paper and message attachments.",
          ],
        },
        {
          id: "envitefy-concierge",
          name: "Envitefy Concierge",
          availability: "core",
          customerPromise:
            "Turn a plain-language event idea into an editable invitation and guest-ready live page without starting from a blank form.",
          proofPoints: [
            "Starts from the host's words or uploaded context and helps collect missing event details.",
            "The public /envitefy-concierge page explains message and upload creation, preview and publishing steps, and example prompts; Live Card attribution links lead here, with signup and login continuing into /chat.",
            "A centered chat composer offers uploads and occasion suggestions through a plus menu, with product choices before the conversation starts and a compact Generate preview option beneath the latest reply when event details are ready.",
            "Prefills names, age, venue, and theme from messages containing several details, and keeps those facts through follow-up replies.",
            "Drafts event-specific guest copy and a polished live page for the host to review and edit before sharing.",
            "Hosts can review saved event details, correct titles and format choices in conversation, and generate a draft preview before a separate publish step.",
            "Generated draft previews and subsequent design edits are saved with the conversation, so hosts can reopen a draft with the same artwork without regenerating it.",
            "Artwork previews appear during supported image generation, with status updates for drawing, checking, refining, and saving. Hosts review the completed draft before publishing.",
            "For newly generated Live Cards with headline-only artwork, date, time, location, and RSVP changes update the event details while keeping the image. Changes to printed wording or the visual design still regenerate artwork.",
            "Hosts can preview an invitation while optional styling and RSVP details are unfinished; publishing checks the required event facts separately.",
            "Hosts can open a full-screen draft preview from the Preview action before publishing, while continuing edits in Concierge. Live-card draft previews include tappable overview, directions, calendar, and configured RSVP or gift-list actions on phones and larger screens. Hosts can try the RSVP form without submitting a guest response.",
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
            "Template and manual creation remain available alongside Envitefy Snap and Envitefy Concierge.",
            "Public landing pages and searchable template galleries cover weddings, birthdays, anniversaries, baby showers, bridal showers, gender reveals, gymnastics, sports, and signup forms.",
            "Visitors can edit manual details and preview their own photos. Temporary drafts stay in the same browser for seven days after the last edit, with a clear recovery message if browser storage fails.",
            "Save and continue opens signup or login. Account saves create a private draft that the owner can reopen from My events and Continue creating; publishing is a separate action.",
            "Category pages such as /weddings and /birthdays offer templates; creation CTAs for Envitefy Concierge open /chat, while introductions link to /envitefy-concierge.",
            "Hosts can choose event-specific layouts, edit wording and details, and review the guest experience before publishing.",
            "Generated Live Cards combine the subject, headline, names, and supplied milestone in full-canvas artwork. Guest action buttons overlay the bottom of the image, with addresses, schedules, and contact information in the detail panels.",
          ],
          sellWhen: [
            "A visitor wants to try an actual design and enter event details before registering.",
            "The customer wants creative control, a specific theme, or a known event structure.",
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
          ],
          sellWhen: [
            "The pain point is lost invitations, scattered screenshots, fridge clutter, or remembering whether the customer is hosting or attending.",
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
            "Separate compact Schedule conflicts and Needs attention tiles count overlapping event times and invitation or event-detail actions. Each opens the relevant details and event links; drafts and declined invitations stay out of the active agenda.",
            "Resume recent saved event drafts, including drafts without a date, in the appropriate editor.",
            "For eligible hosted events, shows recorded going, maybe, and declined replies, plus shared invitations awaiting a reply when those recipients are known.",
            "Enabled hosted sign-up forms show confirmed filled spots, remaining capacity, and section-level needs; waitlisted and canceled claims do not fill spots.",
            "The highlighted event presents Venue, Drive, and Weather in three responsive tiles, with directions, total route mileage, estimated drive time in hours and minutes, and an available event forecast. Drive estimates load automatically from an available profile location, recent saved location, or browser location already allowed by the user, including for events more than 3 days away. A clear Use my location prompt explains the drive estimate and requests browser permission when needed; it also lets users update a saved or home-based estimate from their current location.",
          ],
          sellWhen: [
            "Families or hosts need one place to check upcoming plans, unfinished invitations, guest replies, and volunteer or potluck needs.",
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
                ]
              : [
                  "Guests can manually save events with calendar links or ICS downloads; these actions do not require a connected calendar account.",
                ]),
            "Calendar entries can carry event timing, location, and available reminder information.",
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
            "Specialized pages can keep guest messages, meal information, allergy notes, or other answers with each response.",
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
            "Organizers can create sections and slots with labels, quantities, capacity, time windows, and notes.",
            "Settings can allow multiple slots, limit slots per person, lock full slots, and enable automatic waitlists.",
            "Guests can claim available needs from the shared form without installing an app.",
            "Hosts can see what is claimed, full, waitlisted, or still needed, then edit the live form after sharing.",
            "All 150 signup templates have a distinct curated design across 12 page compositions, with coordinated typography, paper colors, photo framing, and signup rows or cards. Styles include gazettes, menus, botanical invitations, posters, tickets, journals, scrapbooks, and modern studio layouts.",
            "Hosts can keep the original template composition or customize its header, fonts, colors, photos, crops, and spacing. The same saved design appears in the gallery, editor, review, and shared signup page.",
            "All 150 signup designs include original photographic artwork, covering seasonal events, community groups, sports, celebrations, classes, and hobbies.",
            "Every signup template has a square preview of the complete page with editable sample event details, hosts, signup needs, capacities, and questions.",
            "A four-step editor starts with design, then details, signup slots, and review, with reusable starters and browser draft recovery.",
            "Invited guests sign in to claim slots; the public preview shows availability without other participants’ contact information.",
          ],
          sellWhen: [
            "The brief mentions volunteers, helpers, potluck items, snacks, supplies, shifts, slots, capacity, or a waitlist.",
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
            "Choose from 60 gymnastics meet designs with original artwork, distinct names, coordinated typography and layouts, and matching square previews in the gallery and editor.",
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
            "Specialized football and sports builders can structure games, schedules, locations, team details, and attendance information.",
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
    "Always write the full product name 'Envitefy Concierge'; never shorten it to 'Concierge' in customer-facing copy.",
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
