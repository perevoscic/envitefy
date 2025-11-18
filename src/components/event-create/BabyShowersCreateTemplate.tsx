"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BabyShowerTemplateDefinition,
  TemplateVariation,
} from "@/components/event-create/BabyShowersTemplateGallery";
import BabyShowersTemplateGallery from "@/components/event-create/BabyShowersTemplateGallery";

type Props = { defaultDate?: Date };

export default function BabyShowersCreateTemplate({ defaultDate }: Props) {
  const router = useRouter();
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(
    null
  );
  const [appliedVariationId, setAppliedVariationId] = useState<string | null>(
    null
  );

  const defaultDateIso = useMemo(() => {
    if (!defaultDate) return undefined;
    try {
      return defaultDate.toISOString();
    } catch {
      return undefined;
    }
  }, [defaultDate]);

  const handleApplyTemplate = (
    template: BabyShowerTemplateDefinition,
    variation: TemplateVariation
  ) => {
    setAppliedTemplateId(template.id);
    setAppliedVariationId(variation.id);
    const params = new URLSearchParams();
    params.set("templateId", template.id);
    params.set("variationId", variation.id);
    if (defaultDateIso) params.set("d", defaultDateIso);
    router.push(`/event/baby-showers?${params.toString()}`);
  };

  return (
    <main className="px-5 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5D4736]">
            Baby shower site
          </p>
          <h1 className="text-3xl font-semibold text-[#2C1F19]">
            Pick a baby shower template
          </h1>
          <p className="text-sm text-[#63534A] max-w-2xl">
            Choose the palette and typography that fits your sprinkle. You can
            tweak the fonts, registry links, and RSVP info on the next step.
          </p>
        </div>
        <BabyShowersTemplateGallery
          appliedTemplateId={appliedTemplateId}
          appliedVariationId={appliedVariationId}
          onApplyTemplate={handleApplyTemplate}
        />
      </section>
    </main>
  );
}
