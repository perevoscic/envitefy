"use client";

import HeroImageEditor from "@/components/events/HeroImageEditor";
import { createSignupAppearance } from "@/lib/signup-themes";
import type { SignupAppearance, SignupForm, SignupHeaderImageAsset } from "@/types/signup";

export default function SignupImageActions({
  form,
  onChange,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
}) {
  const appearance = form.appearance || {
    ...createSignupAppearance("clean-clear"),
    headerLayout: (form.header?.templateId || "header-1") as SignupAppearance["headerLayout"],
  };
  const layout = appearance.headerLayout;
  const photoCount = layout === "header-6" ? 3 : ["header-4", "header-5"].includes(layout) ? 2 : 1;
  const changeImage = (dataUrl: string, index: number) => {
    const image: SignupHeaderImageAsset = {
      dataUrl,
      name: `Header photo ${index + 1}`,
      type: dataUrl.slice(5, dataUrl.indexOf(";")),
    };
    if (photoCount > 1) {
      const images = [...(form.header?.images || [])];
      while (images.length <= index) {
        images.push({
          ...(form.header?.backgroundImage || image),
          id: `signup-photo-${images.length}`,
        });
      }
      images[index] = { ...image, id: images[index]?.id || `signup-photo-${index}` };
      onChange({ ...form, appearance, header: { ...form.header, images } });
    } else {
      onChange({
        ...form,
        appearance: { ...appearance, headerLayout: layout === "none" ? "header-3" : layout },
        header: { ...form.header, backgroundImage: image, images: [] },
      });
    }
  };
  return (
    <div className="relative z-30 mb-4 flex flex-wrap gap-2">
      {Array.from({ length: photoCount }, (_, index) => (
        <HeroImageEditor
          key={index}
          label={photoCount > 1 ? `Change photo ${index + 1}` : "Change image"}
          onChange={(image) => changeImage(image, index)}
          filterEnabled={appearance.imageFilterEnabled !== false}
          onFilterChange={index === 0 ? (imageFilterEnabled) => onChange({ ...form, appearance: { ...appearance, imageFilterEnabled } }) : undefined}
        />
      ))}
    </div>
  );
}
