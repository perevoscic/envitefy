import type {
  CompositeTargetType,
  FrameCompositeTarget,
  FramePlan,
} from "@/lib/admin/ad-studio/types";

export type CompositePlacement = {
  type: CompositeTargetType;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function computeCompositePlacement({
  target,
  imageWidth,
  imageHeight,
  plan,
}: {
  target: FrameCompositeTarget;
  imageWidth: number;
  imageHeight: number;
  plan: FramePlan;
}): CompositePlacement {
  if (target.type === "invitation") {
    const width =
      target.surface === "fridge"
        ? Math.round(imageWidth * 0.28)
        : Math.round(imageWidth * (plan.format === "horizontal" ? 0.22 : 0.3));
    const height = Math.round(width * 1.4);
    const left =
      target.surface === "fridge" ? Math.round(imageWidth * 0.1) : Math.round(imageWidth * 0.13);
    const top =
      target.surface === "fridge" ? Math.round(imageHeight * 0.2) : Math.round(imageHeight * 0.56);
    return {
      type: target.type,
      left,
      top: Math.min(top, Math.max(0, imageHeight - height - 40)),
      width,
      height,
    };
  }

  const width =
    target.surface === "hero-phone"
      ? Math.round(imageWidth * (plan.format === "horizontal" ? 0.18 : 0.34))
      : Math.round(imageWidth * (plan.format === "horizontal" ? 0.17 : 0.31));
  const height = Math.round(width * 2.05);
  const left =
    target.surface === "hero-phone"
      ? Math.round((imageWidth - width) / 2)
      : Math.round(imageWidth * 0.57);
  const top =
    target.surface === "hero-phone"
      ? Math.round(imageHeight * 0.18)
      : Math.round(imageHeight * 0.22);
  return {
    type: target.type,
    left: Math.max(18, Math.min(left, imageWidth - width - 18)),
    top: Math.max(18, Math.min(top, imageHeight - height - 18)),
    width,
    height,
  };
}
