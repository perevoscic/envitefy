import { createHash, randomUUID } from "node:crypto";
import { query } from "./db";
import type { LiveCardForm } from "./livecard-builder";
import { sharedCardDesignKey } from "./livecard-builder";
import type { SharedCardDesign } from "./shared-card-design";
import { generateSharedCard } from "./shared-card-generation";
import { generateCardHeadline, resolveHeadlineBackground } from "./shared-card-headline";
import { composeCardLettering } from "./card-lettering-composition";
import { LiveCardGenerationFailure } from "./livecard-generation-failure";

export type ArtworkJob = {
  event_id?: string | null;
  id: string; owner_id: string; revision: string;
  state: "queued" | "running" | "ready" | "failed" | "cancel_requested" | "stopped";
  stage: string; form: LiveCardForm; design: SharedCardDesign | null;
  mode: "generate" | "repair" | "verify" | "background"; attempt: number; error: string | null; error_code?: string | null;
  created_at: string; updated_at: string;
};
export const artworkJobDeps = { query, background: generateSharedCard, headline: generateCardHeadline, references: resolveHeadlineBackground, compose: composeCardLettering };
let schema: Promise<unknown> | undefined;
async function ensureSchema() {
  schema ||= artworkJobDeps.query(`CREATE TABLE IF NOT EXISTS livecard_artwork_jobs (
    id text PRIMARY KEY, owner_id text NOT NULL, revision text NOT NULL,
    state text NOT NULL, stage text NOT NULL, mode text NOT NULL, attempt integer NOT NULL DEFAULT 1,
    form jsonb NOT NULL, design jsonb, error text, error_code text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(owner_id, revision))`).then(() => artworkJobDeps.query("ALTER TABLE livecard_artwork_jobs ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS error_code text, ADD COLUMN IF NOT EXISTS event_id uuid")).catch((error) => { schema = undefined; throw error; });
  await schema;
}
export async function readArtworkJob(owner: string, id: string) {
  await ensureSchema();
  return (await artworkJobDeps.query<ArtworkJob>("SELECT * FROM livecard_artwork_jobs WHERE id=$1 AND owner_id=$2", [id, owner])).rows[0] || null;
}
export async function readArtworkJobForAccess(id: string) {
  await ensureSchema();
  return (await artworkJobDeps.query<ArtworkJob>("SELECT * FROM livecard_artwork_jobs WHERE id=$1", [id])).rows[0] || null;
}
export async function createArtworkJob(owner: string, key: string, form: LiveCardForm, design: SharedCardDesign | null, mode: ArtworkJob["mode"], eventId: string | null = null) {
  await ensureSchema();
  const revision = createHash("sha256").update(JSON.stringify([key, sharedCardDesignKey(form), form.title.trim(), form.headlineIntro.trim(), mode, design?.backgroundUrl, form.generationQuality, eventId])).digest("hex");
  const attempt = mode === "repair" ? (await artworkJobDeps.query<{ attempt: number }>(
    "SELECT COALESCE(MAX(attempt),$3::integer)+1 AS attempt FROM livecard_artwork_jobs WHERE owner_id=$1 AND design->>'backgroundUrl'=$2 AND mode IN ('generate','repair')",
    [owner, design?.backgroundUrl, design?.headline?.attempt || 1])).rows[0]?.attempt || 2
    : mode === "verify" || mode === "background" ? design?.headline?.attempt || 1 : 1;
  const row = (await artworkJobDeps.query<ArtworkJob>(`INSERT INTO livecard_artwork_jobs
    (id,owner_id,revision,state,stage,mode,form,design,attempt,event_id) VALUES ($1,$2,$3,'queued','queued',$4,$5::jsonb,$6::jsonb,$7,$8)
    ON CONFLICT (owner_id,revision) DO UPDATE SET revision=EXCLUDED.revision RETURNING *`,
  [randomUUID(), owner, revision, mode, JSON.stringify(form), design ? JSON.stringify(design) : null,
    attempt, eventId])).rows[0];
  return row;
}
export async function cancelArtworkJob(owner: string, id: string) {
  await ensureSchema();
  return (await artworkJobDeps.query<ArtworkJob>(`UPDATE livecard_artwork_jobs SET state=CASE WHEN state='queued' THEN 'stopped' ELSE 'cancel_requested' END, updated_at=now()
    WHERE id=$1 AND owner_id=$2 AND state IN ('queued','running') RETURNING *`, [id, owner])).rows[0]
    || await readArtworkJob(owner, id);
}

/** Durable dispatch claim. An ambiguous worker/provider timeout is never automatically replayed. */
export async function runArtworkJob(owner: string, id: string) {
  const claimed = (await artworkJobDeps.query<ArtworkJob>(`UPDATE livecard_artwork_jobs SET state='running',updated_at=now()
    WHERE id=$1 AND owner_id=$2 AND state='queued' RETURNING *`, [id, owner])).rows[0];
  if (!claimed) return;
  const controller = new AbortController();
  const guard = async () => {
    const row = await readArtworkJob(owner, id);
    if (row?.state !== "running") controller.abort();
    controller.signal.throwIfAborted();
  };
  const stage = async (value: string) => {
    await guard();
    console.info("livecard_job_stage", { jobId: id, revision: claimed.revision, stage: value, mode: claimed.mode, attempt: claimed.attempt, elapsedMs: Date.now() - Date.parse(claimed.created_at) });
    await artworkJobDeps.query("UPDATE livecard_artwork_jobs SET stage=$3,updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='running'", [id, owner, value]);
    await guard();
  };
  let polling = false;
  const monitor = setInterval(() => {
    if (polling) return;
    polling = true;
    void guard().catch(() => controller.abort()).finally(() => { polling = false; });
  }, 2000);
  try {
    await guard();
    let design = claimed.design;
    const previous = design;
    if (claimed.mode === "background" && (!previous?.headline?.layerUrl || !previous.headline.layout || previous.headline.title !== claimed.form.title.trim() || previous.headline.intro !== claimed.form.headlineIntro.trim()))
      throw new Error("There is no compatible saved lettering layer for this alternative.");
    if (!design || claimed.mode === "background") {
      design = await artworkJobDeps.background(claimed.form, controller.signal, (value) => stage(`background_${value}`), { jobId: id, revision: claimed.revision, attempt: claimed.attempt });
      await guard();
      await artworkJobDeps.query("UPDATE livecard_artwork_jobs SET design=$3::jsonb,updated_at=now() WHERE id=$1 AND owner_id=$2 AND state='running'", [id, owner, JSON.stringify(design)]);
    }
    await guard();
    if (claimed.mode === "background") {
      if (!previous?.headline?.layerUrl || previous.headline.title !== claimed.form.title.trim() || previous.headline.intro !== claimed.form.headlineIntro.trim())
        throw new Error("There is no compatible saved lettering layer for this alternative.");
      const background = await artworkJobDeps.references(design.backgroundUrl, controller.signal);
      const layer = await artworkJobDeps.references(previous.headline.layerUrl, controller.signal);
      if (!background[0] || !layer[0]) throw new Error("The saved assets could not be opened for composition.");
      const composition = await artworkJobDeps.compose(Buffer.from(background[0].data, "base64"), Buffer.from(layer[0].data, "base64"), previous.headline.layout);
      await guard();
      design = { ...design, headline: { ...previous.headline, imageUrl: `data:image/webp;base64,${composition.composite.toString("base64")}`, layout: composition.layout } };
    }
    const headline = await artworkJobDeps.headline(claimed.form, design, controller.signal, stage, claimed.mode === "verify" || claimed.mode === "background", { jobId: id, revision: claimed.revision, attempt: claimed.attempt });
    await guard();
    // Conditional commit closes the cancellation-before-completion race.
    await artworkJobDeps.query(`UPDATE livecard_artwork_jobs SET state='ready',stage='ready',design=$3::jsonb,updated_at=now()
      WHERE id=$1 AND owner_id=$2 AND state='running'`, [id, owner, JSON.stringify({ ...design, headline: { ...headline, attempt: claimed.attempt } })]);
  } catch (error) {
    await artworkJobDeps.query(`UPDATE livecard_artwork_jobs SET state=CASE WHEN state='cancel_requested' THEN 'stopped' ELSE 'failed' END,
      error=$3, error_code=$4, updated_at=now() WHERE id=$1 AND owner_id=$2 AND state IN ('running','cancel_requested')`,
    [id, owner, controller.signal.aborted ? "Local workflow stopped. Provider execution status unknown." : error instanceof Error ? error.message : "Artwork workflow failed.", error instanceof LiveCardGenerationFailure ? error.code : controller.signal.aborted ? "cancelled" : "worker_error"]);
  } finally { clearInterval(monitor); }
}
