# Execution packages

This table preserves the planned sequence and ownership. Current implementation status, evidence and remaining acceptance are recorded in [the task manifest](tasks.json) and [implementation report](../create-remediation-implementation.md). Dependencies are acyclic and validated; original findings are not automatically closed by offline checks.

| Task | Wave | Owner | Dependencies | Acceptance details |
| --- | --- | --- | --- | --- |
| GR11: Make reports, review status and infrastructure results unambiguous | 0 | QA/integration agent | REL-01 | [details](guest-release-plan.md) |
| REL-01: Freeze the current baseline, reproduce failures and reconcile existing diagnostics | 0 | Integration lead | None | [details](../create-campaign-remediation-plan.md) |
| CHAT-01: Apply user changes as scoped, provenance-backed transactions | 1 | Facts/conversation worker | REL-01 | [details](chat-facts-plan.md) |
| CHAT-02: Keep output choice, full event identity and semantic category stable | 1 | Facts/conversation worker | CHAT-01 | [details](chat-facts-plan.md) |
| CHAT-03: Use one typed schedule for clocks, itinerary and every export | 1 | Facts/conversation worker | CHAT-01 | [details](chat-facts-plan.md) |
| CHAT-04: Normalize full locations and itinerary roles without dropping or duplicating them | 1 | Facts/conversation worker | CHAT-03 | [details](chat-facts-plan.md) |
| CHAT-05: Promote supplied guest requirements into a public content contract | 1 | Facts/conversation worker | CHAT-01, CHAT-02 | [details](chat-facts-plan.md) |
| CHAT-06: Keep exact approved copy and language structure independent of generated prose | 1 | Facts/conversation worker | CHAT-05 | [details](chat-facts-plan.md) |
| CHAT-07: Remove unsupported public defaults and make unknown facts remain unknown | 1 | Facts/conversation worker | CHAT-05 | [details](chat-facts-plan.md) |
| CHAT-08: Interpret negated privacy instructions and preserve safe parts of a request | 1 | Facts/conversation worker | CHAT-01 | [details](chat-facts-plan.md) |
| CHAT-09: Make replies, Q&A and questions reflect actual state and supported actions | 1 | Facts/conversation worker | CHAT-01, CHAT-02, CHAT-03, CHAT-05, CHAT-08, CHAT-10 | [details](chat-facts-plan.md) |
| CHAT-10: Separate RSVP enablement, host contact, booking intent and category capability | 1 | Facts/conversation worker | CHAT-02, CHAT-05 | [details](chat-facts-plan.md) |
| ART-01: Compile one approved content contract before planning, generation, edits and verification | 2 | Artwork contract worker | CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07 | [details](art-contracts-plan.md) |
| ART-02: Route each requested change to its real surface | 2 | Artwork contract worker | ART-01 | [details](art-contracts-plan.md) |
| ART-03: Make quality decisions consistent with required copy and prohibited interface chrome | 2 | Artwork contract worker | ART-01 | [details](art-contracts-plan.md) |
| ART-04: Diagnose failures and perform one targeted, safe repair with truthful recovery | 2 | Artwork contract worker | ART-02, ART-03 | [details](art-contracts-plan.md) |
| ART-05: Preserve explicit subjects, activities and palette over category defaults | 2 | Artwork contract worker | ART-01 | [details](art-contracts-plan.md) |
| ART-06: Compose concise, readable, deterministic approved copy | 2 | Artwork contract worker | ART-01 | [details](art-contracts-plan.md) |
| ART-07: Preserve product geometry and verify asset/export lifecycle | 2 | Artwork contract worker | ART-02 | [details](art-contracts-plan.md) |
| GR01: Show the complete accepted artwork at every preview size | 3 | Preview/UI agent | ART-07 | [details](guest-release-plan.md) |
| GR02: Preview the real Event Page and enforce actual title contrast | 3 | Preview/UI agent | ART-01, ART-02 | [details](guest-release-plan.md) |
| GR03: Keep guest controls readable and clear of required artwork copy | 3 | Preview/UI agent | ART-01, ART-03 | [details](guest-release-plan.md) |
| GR04: Render complete, readable schedules and nonduplicated locations | 3 | Guest contract agent | CHAT-03, CHAT-04, CHAT-05, CHAT-06 | [details](guest-release-plan.md) |
| GR05: Unify Calendar/ICS payloads and restore Calendar availability | 3 | Guest contract agent | CHAT-03, CHAT-04, CHAT-05, CHAT-10 | [details](guest-release-plan.md) |
| GR06: Offer Directions for every approved physical location | 3 | Guest contract agent | CHAT-04 | [details](guest-release-plan.md) |
| GR07: Make RSVP UI, mode and endpoint requirements one contract | 3 | Guest contract agent | CHAT-10, GR08 | [details](guest-release-plan.md) |
| GR08: Separate school/community open houses from property listings | 3 | Guest contract agent with prompt agent | CHAT-02 | [details](guest-release-plan.md) |
| GR09: Deliver a real downloadable Flyer file | 3 | Preview/UI agent with export owner | ART-01, ART-06 | [details](guest-release-plan.md) |
| GR10: Keep save status truthful and mobile navigation predictable | 3 | Chat state agent with Preview/UI agent | CHAT-01, CHAT-09 | [details](guest-release-plan.md) |
| REL-02: Complete independent offline regression across all 93 crosses and lifecycle boundaries | 4 | Independent verifier | CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10, ART-01, ART-02, ART-03, ART-04, ART-05, ART-06, ART-07, GR01, GR02, GR03, GR04, GR05, GR06, GR07, GR08, GR09, GR10, GR11 | [details](../create-campaign-remediation-plan.md) |
| REL-03: Qualify staging, production operations and rollback before deployment | 5 | Release owner | REL-02 | [details](../create-campaign-remediation-plan.md) |
