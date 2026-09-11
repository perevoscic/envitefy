---
name: envitefy-ad-creative
description: Develop Envitefy ad concepts, scripts, storyboards, visual direction, and campaign copy for new advertisements or substantial creative revisions. Use alone for ideas and copy, or as the creative planning stage of Envitefy Video Producer.
---

# Envitefy Ad Creative

Turn a marketing request into a specific, persuasive idea and a production-ready creative brief. The [video producer](../envitefy-video-producer/SKILL.md) coordinates finished videos; this skill owns the advertising concept and written creative handoff.

## Load the relevant context

The studio root is three directories above this skill folder; the application root is four. Resolve links from this file, not a remembered drive letter.

- Read the [studio preferences](../../../STUDIO-GUIDE.md) and [brand standard](../../../../ENVITEFY_BRAND.md). They govern voice, branding, pronunciation, artwork models, and the ending. Refer to these authorities rather than maintaining another copy of their rules.
- Read relevant entries in the [product marketing catalog](../../../../src/lib/product-marketing-catalog.ts). Respect availability and the demonstrated event type. Use actual UI or implementation evidence for proposed claims; distinguish a planned capture from an inspected working action.
- Consult the [campaign index](../../../projects/README.md) for nearby ideas, then read only relevant briefs and feedback. A reviewed export does not establish audience performance or user approval.
- Use the available [brand](../../../../.agents/skills/brand/SKILL.md), [design](../../../../.agents/skills/design/SKILL.md), or [banner design](../../../../.agents/skills/banner-design/SKILL.md) skills when their outputs are requested. This written stage specifies art direction; asset generation belongs to requested production work.

## Match the request

| Request | Action |
| --- | --- |
| New video or substantially different story | Develop and review the brief, then continue through the producer to the requested finished video. When the producer calls this skill, return the handoff to that same workflow. |
| Ideas, script, storyboard, or ad copy only | Deliver the requested written work. Use existing campaign records when applicable; create a campaign folder only when the user requests saving it or production. |
| Chosen concept or specific creative correction | Develop or repair that direction. Explore alternatives only where the user left a decision open. |
| Trim, resize, caption correction, voice adjustment, or other production edit | Use the producer with the saved brief and feedback. Do not restart concept development. |
| Companion static ads or social copy | Carry the campaign's promise, visual identity, and CTA into the requested formats. For every social post, deliver at least 10 distinct, relevant hashtags/tags per platform, prioritizing the most popular options supported by current evidence; follow the [social post copy standard](../../../STUDIO-GUIDE.md#social-post-copy). Generate assets only when those deliverables are requested. |

Infer routine choices from the request and saved preferences. Ask only when missing information materially changes the audience, offer, deliverable, or authorized spending; continue independent planning while waiting. Full video requests do not require intermediate human concept approval. Ideas-only requests end with ideas.

## Develop the idea

1. Establish the audience and viewing situation, objective, awareness of Envitefy, specific problem or desire, one main promise, supporting product action, and next step. Preserve platform, duration, tone, and formats. Mark inferred motivations as creative hypotheses, not research findings.
2. Where direction is open, explore distinct concepts using [concept development and critique](references/concept-development.md). Change the dramatic situation, reveal, or persuasion approach rather than merely rewriting a headline. Compare with recent campaigns before selecting a direction.
3. Review relevance, the opening, distinctive visual storytelling, credible proof, achievable production, and CTA. Record why the chosen direction fits and what was repaired. Do not invent performance predictions or let a numerical average excuse a false claim or confusing story.
4. Write the timed script/storyboard, visual treatment, audio direction, exact visible copy, asset briefs, and demonstration requirements using the [creative handoff](references/creative-handoff.md). Specify what the viewer notices, framing, lighting, texture, typography hierarchy, and transition logic; "premium" alone is not art direction.
5. Assess comfortable speech timing provisionally, follow the story without narration, and check opening, proof, and ending against the objective. Rewrite an overfull script. The producer measures actual audio and verifies motion, readability, pronunciation, and every final format later.

Keep the selected concept and final copy in the existing brief; keep alternatives, rationale, evidence, and critique in `projects/<campaign>/creative-development.md` when there is a campaign. Do not maintain conflicting final scripts. Creative review concerns the plan, not a declaration that media or user review passed.

## Handoff and learning

The [brief template](../../../templates/campaign-brief.json) is the creative contract. The producer translates it into `production.json` using the [production handoff](../envitefy-video-producer/references/creative-direction.md), preserving scene identity and claim/action/result. This skill does not add engine task types, modify paid-job state, or silently regenerate selected assets.

For requested variants, state what changes and why: for example, a different opening with the same demo and CTA. Label expected effects as hypotheses. When real campaign results are supplied, record metric, source, date range, and variant; use them with user feedback to inform later choices. Internal review is not proof of conversion performance.

Save lasting user preferences in the studio guide and campaign-specific corrections in `feedback.md`. Posting copy does not authorize publishing or sending messages. Finished videos continue through the existing [quality workflow](../envitefy-video-producer/references/quality.md), including independent AI critique, repairs, and the user's final review.
