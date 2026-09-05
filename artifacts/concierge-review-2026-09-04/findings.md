# What broke when we used Envitefy Concierge as customers

September 4, 2026 · http://localhost:3000/chat

We held **19 customer turns across two real conversations** in the running app using fictional party details. One agent acted as a parent planning a joint birthday for twins with competing themes, a limited budget, household RSVPs, privacy concerns, and changing plans (11 turns). I separately acted as someone organizing a family reunion with two activities and different attendance counts (8 turns). We responded naturally to what the concierge actually said, including frustration and corrections.

The main problem is trust: the concierge can sound as though it has understood and saved a request while the visible draft says something else. Several useful capabilities were promised confidently, then qualified only after the customer pushed back.

## Fix these first

### 1. Ordinary sharing language causes irrelevant refusals

**Actual customer:** “Can you help me work out what to send everyone?”

**Concierge:** “I can't post to Facebook, create social media event pages, or contact people for you.”

The reunion customer never mentioned Facebook or asked the concierge to contact anyone. The birthday customer said they would share in their own family WhatsApp group. Both received the same refusal twice, including after clarifying that they would share the link themselves. Both had to rewrite their question a third time to get product advice.

**Improve:** Distinguish asking for an action from asking for advice or preparing something the customer will share. Preserve useful event details even when part of a request cannot be fulfilled. After a correction, acknowledge the misunderstanding and answer the actual question instead of repeating the refusal.

**Better reply:** “For separate adult and child counts, let's first check which RSVP fields are available. You can share the finished link in WhatsApp yourself.”

### 2. The product recommendation relies on unverified RSVP promises

The birthday concierge recommended an Event page because it “supports household RSVPs with separate adult and child counts.” Later, after the customer challenged the recommendation, it said:

> I can’t verify separate adult-and-child count fields from the available setup—so my earlier statement was too definite.

That is the feature the customer was using to choose a product. Discovering the uncertainty after eight turns wastes their effort and undermines the recommendation. The reunion conversation similarly promises independent headcounts for two activities, but only shows text descriptions of those fields.

**Improve:** Recommend products using confirmed capabilities. Distinguish a working field, a free-text workaround, and something requiring manual coordination. Show the actual RSVP controls before asking the customer to proceed. If the requirement cannot be met, explain that before collecting the whole event brief.

### 3. “I've saved it” contradicts the visible event title

The reunion customer asked for **Rivera Family Weekend**. When they pointed out the wrong sidebar name, the concierge confirmed the requested title—but the sidebar instead became the customer's whole paragraph. A second correction produced the same failure with the new paragraph. Only the short instruction “Rename this event to Rivera Family Weekend” fixed it.

In the birthday conversation, the correct name **Alex & Sam's 9th Birthday** drifted through variants such as **Alex and Sam is turning 9th birthday** and **Alex and Sam is turning 9**, even while the concierge claimed it had corrected the title. The final sidebar name became **Sam is turning 9**, dropping Alex completely. This directly violates the customer's central request that both twins be represented equally.

**Improve:** Confirm the saved title, not the intended title. Extract the requested value from a multi-part message instead of treating the entire message as a title. Preserve customer-approved names, including both honorees. Show the changed title immediately so a mismatch is obvious.

### 4. Product scope drifts in the answers and becomes unclear in the UI

The birthday customer chose an Event page. Later the concierge offered to prepare the **Event page, Live card, and Flyer/Invitation** without being asked for all three. After an explicit correction to Event page only, a later review still called it **the Flyer/Invitation**. The ready action was labeled “Generate now” with an accessible description referring to multiple products.

**Improve:** Keep one authoritative product selection visible throughout the conversation. A comparison question or a mention of another format must not add that format to the order. A product change should name the old and new selection and update the visible controls consistently.

### 5. It cannot explain its own next button

When the customer asked whether Generate now creates a preview or publishes, the concierge said it could not verify the behavior and suggested checking the button's confirmation screen.

**Improve:** The concierge must know the effect of its own primary action. Label the action **Generate draft preview**, then use a separate, clearly labeled publishing step. State the current status plainly: draft, generated preview, or published.

## Starting with the chat box

The first screen looks calm and readable, and a customer can type without selecting a category. The message box expands for multiline text; the microphone becomes a Send arrow when text is entered. Those parts worked.

The opening still asks a new customer to choose between Live Card, Flyer/Invitation, and Event Page without a visible plain-language explanation. “Type instead...” presents conversation as a secondary route, although deciding between those products is exactly what a concierge should help with.

During substantive replies the message box is disabled, so the customer cannot compose a correction while waiting. The agent observed roughly 40 seconds for the first substantive birthday answer; this is a manual observation from this local session, not a production latency benchmark. There was no visible Stop control. At readiness, the chat box disappears behind **Keep editing** and **Generate now**, adding an extra step whenever the customer still has a question.

**Improve:** Invite uncertainty in the opening: “Tell me what your guests need to do; I'll help choose the format.” Keep the composer available during thinking and after readiness. Disable duplicate submission if necessary, but let customers write their next message. Offer Stop and useful progress feedback for long waits.

## What it handled well

- It eventually gave useful, natural event copy after the initial refusals.
- It retained the twins' dinosaur-and-space theme, corrected date and time, no-gifts request, and private-address placeholder through several turns.
- It changed the reunion picnic from Saturday to Sunday while preserving Friday dinner.
- When pushed, it admitted uncertainty about approval-based address release and advanced RSVP controls, allowing the customer to choose manual alternatives.

These strengths make the incorrect confirmations more noticeable: the conversation often sounds competent, but the saved state and promised product are not consistently aligned.

## Records

- [Twins birthday: agent's complete conversation and observations](D:/Develop_local/envitefy/artifacts/concierge-review-2026-09-04/agent-conversation.md)
- [Family reunion: eight-turn conversation and visible outcomes](D:/Develop_local/envitefy/artifacts/concierge-review-2026-09-04/family-reunion-dialogue.md)

The findings above are based on actual customer-facing replies and visible draft behavior. A described feature is not treated as verified functionality merely because the concierge says it exists.

## Where the review stops

Both conversations are recorded as local draft conversations. Nothing was published and no invitations were sent. The twins' generated design and actual RSVP controls have **not** been inspected.

An automatic tool approval reviewer blocked Generate now twice. After a read-only check established that event publication is a separate action, the reviewer still required explicit user approval because generation creates additional content. This is a tool approval limitation, not an observed Envitefy generation error. It does not establish that generation fails. Inspecting the generated result requires approval for that remaining step.
