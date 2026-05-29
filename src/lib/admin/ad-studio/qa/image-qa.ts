import type { BaseFrame, CompositeFrame, FramePlan, QAResult } from "@/lib/admin/ad-studio/types";

function pass(name: string, detail: string) {
  return { name, passed: true, detail };
}

function fail(name: string, detail: string) {
  return { name, passed: false, detail };
}

export function runImageQa({
  plan,
  baseFrame,
  compositeFrame,
}: {
  plan: FramePlan;
  baseFrame: BaseFrame;
  compositeFrame: CompositeFrame | null;
}): QAResult {
  const framePlan = plan.frames.find((frame) => frame.frameNumber === baseFrame.frameNumber);
  const checks: QAResult["checks"] = [];
  if (!framePlan) {
    return {
      frameNumber: baseFrame.frameNumber,
      status: "image_qa_failed",
      passed: false,
      failureReason: "Frame plan is missing.",
      retryInstruction: "Regenerate the frame plan and frame together.",
      checks: [fail("frame_plan", "No frame plan item matched this frame.")],
    };
  }

  checks.push(pass("base_frame_exists", "Base image frame was generated."));
  if (!compositeFrame) {
    checks.push(fail("composited_frame_exists", "No composited final frame was produced."));
  } else {
    checks.push(pass("composited_frame_exists", "Final composited frame exists."));
  }

  const requiredTypes = new Set(framePlan.compositeTargets.map((target) => target.type));
  if (requiredTypes.has("invitation")) {
    const hasInvitation =
      Boolean(compositeFrame?.invitationAssetFile) &&
      Boolean(compositeFrame?.placements.some((placement) => placement.type === "invitation"));
    checks.push(
      hasInvitation
        ? pass("invitation_readable", "Deterministic invitation asset was composited.")
        : fail("invitation_readable", "Required deterministic invitation asset is missing."),
    );
  }
  if (requiredTypes.has("phone-ui")) {
    const hasPhoneUi =
      Boolean(compositeFrame?.phoneUiAssetFile) &&
      Boolean(compositeFrame?.placements.some((placement) => placement.type === "phone-ui"));
    checks.push(
      hasPhoneUi
        ? pass("phone_ui_readable", "Deterministic phone UI asset was composited.")
        : fail("phone_ui_readable", "Required deterministic phone UI asset is missing."),
    );
  }

  const prompt = baseFrame.prompt.toLowerCase();
  const protectsText =
    prompt.includes("do not generate readable flyer text") &&
    prompt.includes("do not generate exact phone ui");
  checks.push(
    protectsText
      ? pass(
          "model_prompt_boundaries",
          "Base image prompt forbids generated flyer text and exact UI.",
        )
      : fail(
          "model_prompt_boundaries",
          "Base image prompt does not protect deterministic text/UI.",
        ),
  );

  const avoidsFullFrameReference =
    baseFrame.references.length === 0 ||
    baseFrame.references.every((file) => file.includes("host-identity"));
  checks.push(
    avoidsFullFrameReference
      ? pass("reference_leakage", "Only cropped host identity references were used.")
      : fail("reference_leakage", "A full prior frame appears to be used as a reference."),
  );

  const passed = checks.every((check) => check.passed);
  return {
    frameNumber: baseFrame.frameNumber,
    status: passed ? "passed" : "image_qa_failed",
    passed,
    failureReason: passed
      ? null
      : checks.find((check) => !check.passed)?.detail || "Frame QA failed.",
    retryInstruction: passed
      ? null
      : "Regenerate the base frame with cleaner blank surfaces, then rerun compositing before Veo.",
    checks,
  };
}

export function runCampaignImageQa({
  plan,
  baseFrames,
  compositeFrames,
}: {
  plan: FramePlan;
  baseFrames: BaseFrame[];
  compositeFrames: CompositeFrame[];
}): QAResult[] {
  return baseFrames.map((baseFrame) =>
    runImageQa({
      plan,
      baseFrame,
      compositeFrame:
        compositeFrames.find((frame) => frame.frameNumber === baseFrame.frameNumber) || null,
    }),
  );
}
