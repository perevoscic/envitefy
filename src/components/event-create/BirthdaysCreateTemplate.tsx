"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TemplateVariation,
  BirthdayTemplateDefinition,
} from "@/components/event-create/BirthdayTemplateGallery";
import BirthdayTemplateGallery from "@/components/event-create/BirthdayTemplateGallery";

type Props = { defaultDate?: Date };

export default function BirthdaysCreateTemplate({ defaultDate }: Props) {
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
    template: BirthdayTemplateDefinition,
    variation: TemplateVariation
  ) => {
    setAppliedTemplateId(template.id);
    setAppliedVariationId(variation.id);
    const params = new URLSearchParams();
    // Always include templateId and variationId
    params.set("templateId", template.id);
    params.set("variationId", variation.id);
    if (defaultDateIso) params.set("d", defaultDateIso);
    const query = params.toString();
    // Always redirect to customize page with templateId
    const destination = `/event/birthdays/customize?${query}`;
    router.push(destination);
  };

  return (
    <main className="px-5 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5D4736]">
            Birthday website
          </p>
          <h1 className="text-3xl font-semibold text-[#2C1F19]">
            Pick your birthday template
          </h1>
          <p className="text-sm text-[#63534A]">
            Choose the look and palette you love, then continue to step 2 to
            share your date, venue, and guest details.
          </p>
        </div>
        <BirthdayTemplateGallery
          appliedTemplateId={appliedTemplateId}
          appliedVariationId={appliedVariationId}
          onApplyTemplate={handleApplyTemplate}
          showColorStories={false}
        />
      </section>
    </main>
  );
}
