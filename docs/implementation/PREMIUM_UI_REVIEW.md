# Premium UI Review Board

Date: 2026-06-04

## Review Standard

Every major screen was reviewed against the requested board roles: Product Strategist, UX Architect, Premium UI Designer, Event Industry Expert, Mobile UX Specialist, Conversion Specialist, and Accessibility Reviewer. This document records the merged recommendations and the implementation decisions for this pass.

## Dashboard

- Current problems: Home is visually richer than many workspace pages, but the first-time and next-action journey still needs clearer task grouping.
- Product Strategist: Lead with "Create with Concierge" and show what needs attention.
- UX Architect: Separate upcoming, drafts, pending RSVPs, reminders due, and imports needing review.
- Premium UI Designer: Keep the polished card language, but align card radii, buttons, and metric copy with workspace primitives.
- Event Industry Expert: Owned events and invited events need explicit language so hosts do not confuse events they manage with events they attend.
- Mobile UX Specialist: Keep summary cards short and stack upcoming events with large actions.
- Conversion Specialist: Make creation and publish/share actions obvious.
- Accessibility Reviewer: Ensure metric cards have semantic labels and focus states.
- Final redesign decision: Preserve existing dashboard structure in this pass, but document it as high-priority follow-up unless touched by shared primitives.
- Components changed: None in this pass unless downstream shared components are adopted later.
- Mobile improvements: Manual QA required.
- Accessibility improvements: Manual QA required.

## AI Concierge

- Current problems: The current flow works, but it feels like a parser/debugger rather than the premium creation moment.
- Product Strategist: Make value visible in 5 seconds: describe the event, review the draft, create the page.
- UX Architect: Use a detected mode card, missing details checklist, and draft sections with clear completion states.
- Premium UI Designer: Use a larger prompt box, cleaner examples, and fewer competing borders.
- Event Industry Expert: Examples should cover birthday, class signup, gymnastics/team, and school events.
- Mobile UX Specialist: Prompt and examples must stack cleanly; primary action should be easy to reach.
- Conversion Specialist: "Create event page" should remain the main conversion action after draft review.
- Accessibility Reviewer: Error text must be announced and linked to the prompt area where relevant.
- Final redesign decision: Introduce shared PageHeader, PremiumCard, StepCard, StatusChip, FriendlyError, LoadingSkeleton, and SuggestedActionCard patterns.
- Components changed: `premium-shell.tsx`.
- Mobile improvements: Responsive cards and sticky action component available for follow-up adoption.
- Accessibility improvements: Shared components include semantic sections and visible focus styling.

## Event Overview / Owner Tools

- Current problems: Owner management is split between `/events/[id]/manage`, public owner preview, and Concierge V2 workspace routes.
- Product Strategist: The owner should immediately see publish status, share link, RSVP summary, schedule summary, and next recommended action.
- UX Architect: Create one workspace overview route or make Hub serve this role clearly.
- Premium UI Designer: Use a guest page preview card rather than raw tools.
- Event Industry Expert: Hosts care about readiness, guests, food/forms/signups, reminders, and day-of tasks.
- Mobile UX Specialist: Overview should stack in order of urgency.
- Conversion Specialist: Publishing and sharing should be the obvious next actions.
- Accessibility Reviewer: Preview links need accessible names and status should not be color-only.
- Final redesign decision: Treat Concierge V2 Hub as the near-term overview for team/class/parent modes; broader owner overview remains follow-up.
- Components changed: Shared primitives ready.
- Mobile improvements: Hub refactor planned.
- Accessibility improvements: Hub refactor planned.

## Public Guest Page

- Current problems: Public dispatcher is large and route behavior is nuanced. Guest page must not inherit organizer/admin UI.
- Product Strategist: Guests need immediate confidence: title, date/time, location, RSVP, host note, calendar save.
- UX Architect: Keep admin controls out of guest view and maintain access-code/deleted states.
- Premium UI Designer: Preserve specialized skins and beautiful theme renderers.
- Event Industry Expert: Guests should not see internal setup, resources, or operations.
- Mobile UX Specialist: Above-fold action must be tappable and not hidden by browser chrome.
- Conversion Specialist: RSVP and calendar save should be prominent.
- Accessibility Reviewer: RSVP controls and calendar links need clear labels.
- Final redesign decision: Do not refactor the dispatcher in this pass; audit flags high-priority manual QA by renderer.
- Components changed: None.
- Mobile improvements: Manual QA required.
- Accessibility improvements: Manual QA required.

## Schedule Hub

- Current problems: Schedule is functional but still feels like editing records.
- Product Strategist: Make agenda-building the goal and conflicts the exception.
- UX Architect: Keep Agenda, Calendar/List, and Needs attention tabs; show the next item and no-conflict success.
- Premium UI Designer: Replace dense cards with calmer premium cards and chips.
- Event Industry Expert: Labels should adapt to practice/session/class party/deadline/travel.
- Mobile UX Specialist: Date groups and expandable cards work better than table-like editing.
- Conversion Specialist: "Add schedule item" should be the main CTA.
- Accessibility Reviewer: Tabs should expose active state and controls need labels.
- Final redesign decision: Adopt shared header, metric cards, status chips, empty states, and friendlier add/edit labels.
- Components changed: Shared primitives plus schedule client.
- Mobile improvements: Stacked cards and large controls.
- Accessibility improvements: Labeled inputs and aria-aware status chips.

## RSVP Board

- Current problems: Good data model, but needs host guidance around pending guests and reminder actions.
- Product Strategist: The page should answer who is coming and who needs follow-up.
- UX Architect: Summary cards should include Yes, Maybe, No, Pending, Kids, Adults.
- Premium UI Designer: Use consistent card shells, selected state, and lighter filters.
- Event Industry Expert: Food, allergy, kids/adults, and custom answers are the high-signal fields.
- Mobile UX Specialist: Guest list should stack above details; search must be full-width.
- Conversion Specialist: Pending filter and reminder CTA should increase response completion.
- Accessibility Reviewer: Search labels and selected guest states need accessible names.
- Final redesign decision: Adopt shared header, metric cards, status chips, empty/no-result states, and friendlier subtitle.
- Components changed: Shared primitives plus RSVP client.
- Mobile improvements: Existing stack retained and polished.
- Accessibility improvements: Search/input labels and non-color status text.

## Imports / OCR

- Current problems: The workflow says "Source Import" and "proposed items", which sounds technical.
- Product Strategist: Make importing feel like a guided review flow, not a parser.
- UX Architect: Show the five steps: upload/paste, reading, found details, accept/reject, add to event.
- Premium UI Designer: Use step cards and a clearer split between input and review.
- Event Industry Expert: Say uploaded flyer, schedule, email, team packet, or class note depending context.
- Mobile UX Specialist: Upload and review should stack; action bar should remain reachable.
- Conversion Specialist: Review accepted details and add them to schedule/event.
- Accessibility Reviewer: File input and status updates need readable labels.
- Final redesign decision: Rename copy around "Review imported flyer or file" and use shared step/empty/error patterns.
- Components changed: Shared primitives plus imports client.
- Mobile improvements: Stacked cards and action sizing.
- Accessibility improvements: More explicit form labels and status text.

## Resources / Setup

- Current problems: The screen is not mode-aware and hard-codes team/gym resource language for birthday examples.
- Product Strategist: Users should understand this page is for "what the event needs" and who owns it.
- UX Architect: Rename by mode and split setup items, assignments, and day-of check-in.
- Premium UI Designer: Replace raw resource board with premium setup cards, friendlier metrics, and clearer empty states.
- Event Industry Expert: Birthday/social needs food, decorations, seating, helpers, parking, pool access; gymnastics/team needs coaches, apparatus, rooms, travel; school/class needs volunteers, snacks, supplies, permission slips, classroom, chaperones.
- Mobile UX Specialist: Forms need stacked labels, large buttons, and no two-column squeeze below tablet.
- Conversion Specialist: "Add setup item" is the primary action; assignments should follow after items exist.
- Accessibility Reviewer: Inputs need labels and placeholders cannot be the only label.
- Final redesign decision: Implement centralized mode copy and taxonomy, update title/subtitle/metrics/form categories/placeholders/empty states/buttons.
- Components changed: Shared primitives, `mode-copy.ts`, Resources client.
- Mobile improvements: Form fields use labels and responsive grids.
- Accessibility improvements: Labeled inputs, semantic empty states, accessible status chips.

## Team / Class / Parent Hub

- Current problems: Has useful mode copy but still uses workspace/member language and raw participant concepts.
- Product Strategist: Hub should be the organizer's cockpit for people, families, and upcoming responsibilities.
- UX Architect: Show recommended next action and use mode-specific labels for roster/students/families.
- Premium UI Designer: Align with premium cards and status chips.
- Event Industry Expert: Teachers need parents, forms, supplies, chaperones; coaches need roster, sessions, fees, travel.
- Mobile UX Specialist: Invite/add forms must stack and avoid cramped grid fields.
- Conversion Specialist: Invite helpers/parents and add roster should be primary setup actions.
- Accessibility Reviewer: Role selects and participant forms need explicit labels.
- Final redesign decision: Adopt shared header/metric cards where possible and preserve existing mode-copy function.
- Components changed: Shared primitives plus partial hub client polish.
- Mobile improvements: Planned through shared shells.
- Accessibility improvements: Planned labels for key inputs.

## Forms

- Current problems: Smart signup and RSVP custom answers risk feeling schema-driven.
- Product Strategist: Focus on what hosts need to ask and collect.
- UX Architect: Use question cards, suggestions, preview, and response summary.
- Premium UI Designer: Avoid database-builder layout.
- Event Industry Expert: Parent-friendly suggested questions matter by mode.
- Mobile UX Specialist: One question per card with clear edit actions.
- Conversion Specialist: Suggested questions increase setup completion.
- Accessibility Reviewer: Question labels and required state must be announced.
- Final redesign decision: Audit only in this pass; detailed builder refactor remains follow-up.
- Components changed: None.
- Mobile improvements: Manual QA required.
- Accessibility improvements: Manual QA required.

## Volunteer Signup

- Current problems: Signup slots must not look like raw capacity records.
- Product Strategist: Make claiming a slot obvious and show what is still needed.
- UX Architect: Group slots by time/task with claimed/unclaimed status.
- Premium UI Designer: Use compact slot cards and status chips.
- Event Industry Expert: Include snacks, setup, chaperones, check-in, concessions by mode.
- Mobile UX Specialist: Single-column slot cards with thumb-friendly claim buttons.
- Conversion Specialist: Highlight unclaimed slots and reminder action.
- Accessibility Reviewer: Capacity status must not be color-only.
- Final redesign decision: Audit only in this pass; use shared components for future smart signup/ops refactor.
- Components changed: None.
- Mobile improvements: Manual QA required.
- Accessibility improvements: Manual QA required.

## Payment Tracker

- Current problems: Payment tracking can drift into accounting language.
- Product Strategist: Hosts need paid/unpaid, due dates, and notes.
- UX Architect: Use simple cards and manual mark-paid actions.
- Premium UI Designer: Light status chips, not ledger tables.
- Event Industry Expert: Fit fees, dues, costume payments, field trip money, class gifts.
- Mobile UX Specialist: Cards and quick actions, no tiny tables.
- Conversion Specialist: Due reminders and mark-paid reduce friction.
- Accessibility Reviewer: Amounts and due status need text labels.
- Final redesign decision: Audit only; planned for Ops refactor.
- Components changed: None.
- Mobile improvements: Manual QA required.
- Accessibility improvements: Manual QA required.

## Navigation / Sidebar / Header

- Current problems: Workspace navigation is route-based and not always journey-based.
- Product Strategist: Navigation should show the host path from create to publish to manage.
- UX Architect: Suggested tabs: Overview, Guest Page, Schedule, RSVPs, Forms, Signups, Reminders, Payments, Setup, Imports. Only show mode-relevant tabs or tabs with data.
- Premium UI Designer: Header actions should be consistent pills/buttons.
- Event Industry Expert: Use "Setup" for social/school and "Resources" for gymnastics/team.
- Mobile UX Specialist: Tabs should scroll horizontally or collapse without breaking layout.
- Conversion Specialist: Keep Create, Publish, Share, and Send reminder visible at the right time.
- Accessibility Reviewer: Active nav state must be textual and focusable.
- Final redesign decision: Shared `ResponsiveTabs` and `ActionBar` are introduced for incremental adoption.
- Components changed: Shared primitives.
- Mobile improvements: Scrollable tabs available.
- Accessibility improvements: Button/link focus states standardized.

