# Local concierge customer conversation — September 5, 2026

Target: http://localhost:3000/chat. These were natural messages from a fictional host, entered through the chat box in Chrome. The host is planning her mum Elena’s 60th, feels overwhelmed, has 28 guests and $600, wants equal English/Spanish wording, and needs simple private guest replies. No event was published or artwork generated.

## Assessment

The earlier changes helped: sharing in the host’s own WhatsApp group no longer triggered a refusal, and the concierge initially supplied a useful budget and bilingual save-the-date. It still failed when the host needed practical help after learning a limitation, and when several ordinary corrections arrived together.

The code now fixes the observed extraction and routing failures, and the local UI confirms the corrected title, date, location, format, RSVP choice and planning count. The revised AI conversation is **not yet verified**: the configured AI account began returning HTTP 429, code `credit_balance_exhausted`, during this session. A short provider diagnostic confirmed that it has no remaining API credits. This is API billing, separate from Codex account usage.

## Recorded failures and improvements

| Situation | Actual failure before changes | Change and evidence |
| --- | --- | --- |
| Natural, worried introduction | The entire long introduction became the sidebar draft title. | Canonical title sanitation and possessive milestone recognition. Local retry saved “Elena is turning 60”. |
| Household counts, vegetarian meals and private address | Returned two limitation paragraphs; ignored the vegetarian question and the request to make this manageable. | Capabilities now ground the contextual response instead of overriding it. Practical manual-reply fallback includes adults, children, vegetarian meals and a private-address workflow. AI version needs rerun after credits return. |
| “I understand… Please don’t explain those limits again” | Repeated the same address limitation verbatim and omitted the requested message. | Accepted limitations no longer repeat in the fallback; local retry supplied a specific private reply message and tracking suggestion. |
| Exact title + reschedule + location + RSVP off | Ignored “title it exactly”; interpreted “move it to Saturday…” as a location and swallowed the remaining instructions; asked for host phone/email. | Separate quoted field values, temporal versus location moves, explicit online RSVP switches and canonical normalization. Local saved-detail review confirmed the intended values. |
| “No host phone or email on the card… show me exactly what you saved” | Treated the word “phone” as an unrelated technical request and returned a generic scope refusal. | Phone contact editing is treated as event work; actual phone repair requests still route away. Behavioral regression covers the full recovery message. |
| Request to write invitation wording | Ordinary “invitation” was changed to “Flyer/Invitation” in assistant prose. | Only internal identifiers containing underscores are replaced with product labels. |
| Wording review and later edits | Saved wording was hard to inspect and fallback edits regenerated generic prose. | Saved-detail review is available throughout the conversation and includes the actual saved body. Bilingual paragraphs are retained; stale factual prose is discarded when it conflicts with a correction. |
| AI provider unavailable | Quietly fell back to repetitive “When should this happen?” questions. | Failed tailored replies are now identified clearly, with useful supported planning/reply guidance where available. Wording requests are not replaced with the previous reply-management plan. |

## Before-change dialogue

Draft: `session_mtoe5c34`.

**1. Host:** “I’m a bit overwhelmed. I’m organising my mum Elena’s 60th, about 28 people in Chicago… She loves gardens and old jazz records. Some relatives read Spanish, some English. I’ve got about $600 for food and decorations, and I’m doing this on my own… I haven’t picked a date or venue… rather than ask me a whole form of questions.”

**Concierge:** Recognized Elena, 28 guests, Chicago and the garden/jazz direction. Suggested a daytime patio, garden room or home gathering with catered trays and restrained flowers, then offered bilingual wording once the date and place were chosen. The sidebar nevertheless copied the entire introduction.

**2. Host:** “A home gathering sounds manageable. Could you give me a simple split of the $600 and a short English-and-Spanish save-the-date with the date left as TBC? Please don’t wait for me to have every detail before helping. Also, should I use a live card or an event page? I don’t know what I need yet.”

**Concierge:** Suggested $390 food/drinks, $120 flowers/candles/table details, $60 dessert, $30 supplies. Recommended a live card for WhatsApp and an event page for fuller details. Supplied English and Spanish save-the-date text with the date marked TBC/Por confirmar. This turn was useful and did not select unwanted products.

**3. Host:** “Let’s use a live card then. Sunday October 18, 2026, 4 to 7 pm at my home in Chicago, exact address later. No gifts. I’m worried about managing replies: can the RSVP ask how many adults and children are coming and whether they want vegetarian food, and only show my address after I approve them? I’d love you to take care of this because I’m not very technical.”

**Concierge:** “The RSVP created here collects a name, email and yes, no or maybe. This chat cannot add separate adult and child count fields; choosing an Event page does not change that. You can collect family counts separately, or use a specialized RSVP flow.

I can’t set up address release after RSVP approval in this chat. We can display ‘Exact address shared privately’ and you can provide the address yourself; that wording is not an automatic privacy control.”

**4. Host:** “That feels like a list of things you can’t do, and I’m still left figuring it out. I understand there are no separate adult and child fields or address approval. Please don’t explain those limits again. Recommend one simple way for me to collect the family numbers and vegetarian requests, write the exact message I should send, and help me keep the address private. I need a next step I can actually manage.”

**Concierge:** Repeated the address paragraph above verbatim. It supplied none of the requested practical help.

**5. Host:** “You’re repeating the same thing. Let’s move on. Keep only the live card and title it exactly ‘Elena, 60 años de alegría’. Move it to Saturday October 24, 2026, 4 to 7 pm; October 18 is cancelled. Keep ‘Chicago — exact address shared privately’ as the location. Turn the online RSVP off: I’ll collect replies myself. No gifts, garden and vintage jazz, and equal English and Spanish text. Please write the invitation now, including a request for a private reply with the number coming and vegetarian meals needed.”

**Concierge:** “Got it - updated the location to Saturday October 24, 2026, 4 to 7 pm; October 18 is cancelled. Keep ‘Chicago — exact address shared privately’ as the location. Turn the online RSVP off: I’ll collect replies myself. No gifts, garden and vintage jazz, and equal English and Spanish text. Please write the Flyer/Invitation now, including a request for a private reply with the number coming and vegetarian meals needed. What phone number or email should guests use if they need to reach the host?”

**6. Host:** “That’s a date, not a location. I don’t want to keep fixing this. The location should say only ‘Chicago — exact address shared privately’; the date is October 24, 2026, 4–7 pm. The title must be ‘Elena, 60 años de alegría’. No online RSVP and no host phone or email on the card. Before I go further, show me exactly what you have saved and the English and Spanish invitation wording, so I can trust it.”

**Concierge:** “I can help with Envitefy event products, RSVP, uploads, guest pages, and event edits. Tell me what you’re creating or choose a category.”

## Local retry after changes

Draft: `session_mtoetvz5` at http://localhost:3000/chat?thread=session_mtoetvz5.

- Repeated the same opening: title correctly became **Elena is turning 60**. The first two retry replies were still “When should this happen?”, which prompted investigation of the provider connection and exposed the credit exhaustion.
- After transparent error handling was added, the same RSVP question received an unavailable-tailored-reply notice, accurate capability limits, and a concrete manual plan.
- Repeating “I understand… don’t explain those limits again” received the plan and exact message without repeating the capability refusal:

  “Please reply to me privately with the number of adults and children coming and how many vegetarian meals you need. I’ll share the exact address with you privately.”

- Repeated the combined correction. The sidebar and expanded saved-detail review displayed:
  - Format: **Live card** only.
  - Title: **Elena, 60 años de alegría**.
  - When: **Saturday October 24, 2026, 4 to 7 pm**. A duplicated start time in this review was also removed.
  - Where: **Chicago — exact address shared privately**.
  - RSVP: **Off**.
  - Expected guests: **28 (planning count)**.
  - Gift note: **No gifts**.
- The draft offered **Generate draft preview** and kept the composer available. Neither Generate nor Publish was clicked.
- Full bilingual invitation generation remains unverified and unavailable in this outage. The saved wording was still the generic “Join us to celebrate Elena turning 60.” The new review makes that visible; the report does not count it as a successful bilingual invitation.
- The original local dev server stopped during the final recovery turn, producing “Failed to fetch” and then `ERR_CONNECTION_REFUSED`. Restarted the project’s existing `scripts/dev-single.js` on port 3000 with its database access restored. Reopening the saved draft confirmed the conversation, exact title and selected Live Card survived. This interruption was separate from the confirmed AI credit exhaustion.
- Repeated the full sixth recovery message after restoring localhost. It no longer refused the event request or repeated reply-management advice. It honestly reported that the tailored reply could not be completed; expanded review retained the exact title/location, October 24 from 4–7 pm, RSVP Off, 28 guests and No gifts. The local server logs independently confirmed `credit_balance_exhausted` on that request.

## Validation and remaining work

**78 focused checks passed** across eight suites. They cover these actual host messages, accepted limits, exact field overrides, stale model values, multilingual paragraphs, contact removal, changed dates/times in the event’s timezone, useful fallback behavior and transparent AI failure. **Biome passed for all 13 changed code/test files checked.** The VS Code diagnostics bridge is unavailable. Repository TypeScript checking reports existing errors, including three existing fallback-test diagnostics, with no errors in the edited runtime files checked. The UI source suite has 9 passes and its two previously documented failures (`ChatOutputPreviewSurface` and the `hasRsvp` declaration). The legacy fallback suite retains the same 20 pre-existing date-sensitive failures.

After API credits are restored, repeat this same local conversation with the AI active. Verify that it supplies equal English/Spanish content, uses the saved copy in its review, keeps later edits consistent with that copy, and gives one actionable recommendation without recurring refusals. Then use a different ordinary host scenario to check that the improvement generalizes. Do not label the concierge fully verified before that rerun.
