# Applied concierge recommendations — September 5, 2026

The host conversation was continued on localhost:3000. Changes are local and uncommitted. No invitation was generated, published or sent to guests during this round.

## What changed

- **Useful help before all details are known.** A writing request can produce a clearly labelled, editable English/Spanish starting invitation with TBC logistics even while the language model is unavailable. Budget/format questions can receive a practical suggested plan. Saved access needs influence the fallback's next step.
- **Persistent host priorities.** The draft carries a source-grounded host brief: budget and scope, languages, accessibility, dietary needs, privacy, workload and manual/online reply preferences. It is saved with the existing draft and displayed under “What matters to you.” Omitted topics stay saved, explicit corrections/retractions update the relevant topic, and model-authored preferences cannot overwrite user facts.
- **One saved invitation.** The chat appends the exact canonical invitation text, so the displayed wording and saved body agree. Unrelated extraction cannot rewrite approved prose. Language/reply/privacy changes refresh a basic draft or flag approved wording for an update. Required AI language blocks must be complete; a removed language cannot remain marked ready. Preview logistics use canonical event fields.
- **Recoverable interrupted replies.** “Try answer again” survives later edits and reopening. It retries writing/advice against current event details without reapplying the original instruction's obsolete date, title or location. Network retries retain this behavior. Unrelated turns do not discard an unfinished invitation request.
- **Privacy follows the generated event fields.** A confirmed private-address request masks canonical location/venue and additional-stop address/map fields, as well as preview text. Known private address/contact paragraphs are removed from guest copy and marked for review. Hosts can keep online RSVP while declining to display personal contact information; that decision no longer triggers repeated contact questions.
- **Natural corrections.** Date-only answers are not treated as missing venues. “Write the invitation now” and “Use English only now” do not schedule the event for the current moment.
- **Clear current priorities.** The saved review displays normalized needs such as “Step-free access.” Original user citations remain internal evidence; their old budget/language clauses are not repeated in the current priorities review after those facts change.
- Updated the shared product marketing catalog to describe the verified host brief, provisional wording and recovery capabilities.

## Ordinary-host conversation on localhost

Saved conversation: http://localhost:3000/chat?thread=session_mtohpa2o

1. **Host:** “I'm planning my mum Elena's 60th birthday for 28 people in Chicago. I feel overwhelmed doing this on my own. We have $600 for food and decorations, some relatives read English and some Spanish, and two relatives need step-free access. No gifts. I'll collect replies privately with the adults, children and vegetarian meals each family needs. Keep the exact address private. I have no date or venue yet. Help me start with one manageable next step.”

   **Observed:** A transparent unavailable-tailored-reply notice, a suggested manageable home gathering and a $600 allocation. A saved-details review and “Try answer again” were available. The opening initially retained too much text in the budget scope and omitted the access requirement in the basic advice; both were corrected in this round and covered by a behavioral check.

2. **Host:** “Let's use the live card. Please write the invitation now with date and venue TBC. It should sound warm and grown-up, not like a children's party, and please remember what my family needs without making me repeat everything.”

   **Observed:** The reply supplied English and Spanish starting wording with no-gifts language, private household adult/child counts, dietary needs and private-address wording. Date remained TBC. The expanded saved review showed the same body and retained budget, languages, step-free access, dietary needs, privacy, workload and reply plan. It did not make the host answer the date question first.

   Example saved text: “Your presence is the best gift; no gifts, please.” / “Tu presencia es el mejor regalo; no hace falta traer regalos.”

3. **Host:** “Our budget is now $450 for food and decorations. Use English only. The title should be exactly 'Elena, Our Jazz Queen'. The date is October 24, 2026, 4 to 7 pm. Set the location to 'Chicago — exact address shared privately'. Turn online RSVP off; I'll keep collecting replies privately. Keep everything else we discussed.”

   **Observed:** Saved review showed the exact new title, October 24 from 4–7 pm, the exact private location placeholder, RSVP Off, 28 guests and No gifts. Budget changed to $450 for food and decorations; language changed to English. Starting copy became English-only while access/dietary/workload preferences remained saved.

4. **Host action:** Clicked **Try answer again** for the earlier unfinished invitation.

   **Observed:** The retry used “Elena, Our Jazz Queen,” October 24 from 4–7 pm, the private Chicago placeholder and the current English-only body. It did not restore the older title, TBC date or bilingual body, and did not add a duplicate user message. The language-specific When/Where labels were subsequently corrected too.

5. **Host action:** Reloaded the saved conversation and expanded its review.

   **Observed:** The corrected title, date, private location, RSVP choice, $450 budget, English-only wording, accessibility/dietary/workload priorities and unfinished-answer retry control survived reopening. The review initially repeated the old $600/Spanish clauses inside an accessibility source citation; the display now uses the normalized accessibility need and a regression check guards against showing those superseded facts.

## Independent review and validation

The delegated reviewer reproduced and identified four additional failures: private preview/raw-address mismatch, lost retry flag on network retry, pending work cleared by unrelated turns, and stale/empty language sections accepted as ready. All four were addressed with focused checks.

- 102 checks passed across 10 concierge suites, including 30-turn preference retention and serialized draft restoration, exact corrections, privacy, language changes, canonical copy, mocked AI recovery, pending work and provider failure.
- 15 upload/UI guards passed. The existing date-confirmation guard was updated to cover the intentional answer-retry exception and retention of the retry flag.
- Biome passed for all 19 checked source/test files.
- A focused strict TypeScript check also passed for the host-brief implementation after its last review-display change.
- The repository TypeScript check reported 183 existing diagnostics outside the changed runtime code, including the three previously documented fallback-test diagnostics. No changed runtime file appeared in the output. This is not a clean repository-wide type check.
- The required VS Code diagnostics wrapper was attempted; its Chat to CLI bridge is unavailable in this environment.

## Remaining verification limit

The actual local provider still returns HTTP 429 with `credit_balance_exhausted` / `insufficient_quota`. The local dialogue therefore verifies useful basic copy, saved state, corrections, privacy and retry behavior during an outage. Mocked-provider checks exercise the successful response and normalization paths. They do not establish the quality of real tailored AI replies.

After the API account has credits, repeat this same localhost dialogue with the real model, then use a different host scenario to assess naturalness, complete translations and how well the advice adapts. Generation/publication and guest delivery were outside this round's verification.
