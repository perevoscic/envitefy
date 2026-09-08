import BabyShowerTemplateView from "@/components/BabyShowerTemplateView";
import { getBabyShowerDesign, getBabyShowerTheme } from "@/lib/baby-shower-designs";

export default function BabyShowerDesignPreview({ designId }: { designId: string }) {
  const design = getBabyShowerDesign(designId);
  if (!design) return null;
  const sample = design.sample;
  return (
    <BabyShowerTemplateView
      eventId=""
      eventTitle={`${sample.babyName}'s Baby Shower`}
      eventData={{
        templateId: design.id,
        babyName: sample.babyName,
        momName: sample.momName,
        date: sample.date,
        time: sample.time,
        address: sample.venue,
        city: sample.city,
        state: sample.state,
        heroImage: design.heroImage,
        themeId: design.themeId,
        theme: getBabyShowerTheme(design),
        hosts: [{ name: sample.host, role: "Your hosts" }],
        babyDetails: { notes: sample.notes },
        momDetails: { notes: sample.hostNote },
        rsvpEnabled: false,
      }}
      shareUrl=""
      isOwner={false}
      isReadOnly
      editHref=""
      preview
      thumbnail
    />
  );
}
