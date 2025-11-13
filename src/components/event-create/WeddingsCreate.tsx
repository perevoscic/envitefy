"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TemplateVariation,
  WeddingTemplateDefinition,
} from "@/components/event-create/WeddingTemplateGallery";
import WeddingTemplateGallery from "@/components/event-create/WeddingTemplateGallery";

type Props = { defaultDate?: Date };

export default function WeddingsCreate({ defaultDate }: Props) {
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
    template: WeddingTemplateDefinition,
    variation: TemplateVariation
  ) => {
    setAppliedTemplateId(template.id);
    setAppliedVariationId(variation.id);
    const params = new URLSearchParams();
    params.set("templateId", template.id);
    params.set("variationId", variation.id);
    if (defaultDateIso) params.set("d", defaultDateIso);
    const query = params.toString();
    const destination = query ? `/event/new?${query}` : "/event/new";
    router.push(destination);
  };

  return (
    <main className="px-5 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5D4736]">
            Wedding website
          </p>
          <h1 className="text-3xl font-semibold text-[#2C1F19]">
            Pick your heirloom template
          </h1>
          <p className="text-sm text-[#63534A]">
            Choose the look and palette you love, then continue to step 2 to
            share your date, venue, and guest details.
          </p>
        </div>
        <WeddingTemplateGallery
          appliedTemplateId={appliedTemplateId}
          appliedVariationId={appliedVariationId}
          onApplyTemplate={handleApplyTemplate}
        />
      </section>
    </main>
  );
}
