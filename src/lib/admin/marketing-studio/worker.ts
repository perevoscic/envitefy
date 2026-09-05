import { runStudioVersion } from "./worker-core.ts";

export async function processStudioVersion(id: string): Promise<void> {
  const [repository, assets, providers, media] = await Promise.all([
    import("./repository.ts"), import("./assets.ts"), import("./providers.ts"), import("./media.ts"),
  ]);
  const video = providers.createOmniProvider();
  await runStudioVersion(id, {
    ...repository, ...assets,
    developIdea: providers.developStudioIdea, generateImage: providers.generateStudioImage,
    submitVideo: video.submit, pollVideo: video.poll, downloadVideo: video.download,
    finishImage: media.finishStudioImage, finishVideo: media.finishStudioVideo,
  });
}

export async function reconcileStudioVersions(): Promise<{ processed: number; failed: number }> {
  const { getDueVersionIds } = await import("./repository.ts");
  const ids = await getDueVersionIds(5);
  const results = await Promise.allSettled(ids.map(processStudioVersion));
  return { processed: results.filter(result => result.status === "fulfilled").length, failed: results.filter(result => result.status === "rejected").length };
}
