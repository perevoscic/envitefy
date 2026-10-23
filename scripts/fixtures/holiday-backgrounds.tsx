import { useState } from "react";
import { createRoot } from "react-dom/client";
import HolidayPageBackground, { HolidayBackgroundPicker } from "@/components/events/HolidayPageBackground";
import ThemedEventHeader from "@/components/templates/ThemedEventHeader";
import TemplateBodyLayout from "@/components/templates/TemplateBodyLayout";
import { getGeneralEventPageDesign, getGeneralEventBodyPresentation } from "@/lib/general-event-presentation";
import { getHolidayBackground, getHolidayBackgroundChoice, type HolidayBackgroundChoice } from "@/lib/holiday-backgrounds";
import SignupDesignPanel from "@/components/smart-signup-form/SignupDesignPanel";
import SignupPageRenderer from "@/components/smart-signup-form/SignupPageRenderer";
import { createSignupTemplateForm } from "@/lib/signup-starters";
import { getSignupDesign } from "@/lib/signup-designs";
import { sanitizeSignupForm } from "@/utils/signup";
import type { SignupForm } from "@/types/signup";
import signupEditorStyles from "@/components/smart-signup-form/signup-editor.module.css";

function Fixture() {
  const [designId, setDesignId] = useState("holidays--halloween--friendly-ghosts");
  const [choice, setChoice] = useState<HolidayBackgroundChoice>();
  const [showPicker, setShowPicker] = useState(false);
  const [signupForm, setSignupForm] = useState<SignupForm>();
  const [signupPreview, setSignupPreview] = useState(false);
  const original = getGeneralEventPageDesign(designId)!;
  const background = getHolidayBackground(designId, choice)!;
  const design = { ...original, background: background.page, ink: background.ink, accent: background.accent };
  (window as any).showHoliday = (nextId: string, presetId?: string, picker = false) => {
    setSignupForm(undefined);
    setDesignId(nextId);
    setChoice(presetId ? getHolidayBackgroundChoice(presetId) : undefined);
    setShowPicker(picker);
  };
  (window as any).showHolidaySignup = (nextId: string, presetId?: string) => {
    const design = getSignupDesign(nextId)!;
    const form = createSignupTemplateForm({ id: nextId, name: design.name, heroImage: design.artwork });
    if (presetId && form.appearance) form.appearance.pageBackground = getHolidayBackgroundChoice(presetId);
    setSignupForm(form);
    setSignupPreview(false);
    (window as any).holidaySignupWrites = 0;
  };
  if (signupForm) return <>
    <aside className={signupEditorStyles.editor} style={{ maxWidth: 420 }}>
      <button type="button" onClick={() => setSignupPreview(!signupPreview)}>{signupPreview ? "Edit signup" : "Preview signup"}</button>
      <button type="button" onClick={() => {
        const saved = JSON.stringify(sanitizeSignupForm(signupForm));
        (window as any).holidaySignupSaved = saved;
        (window as any).holidaySignupWrites++;
        setSignupForm(sanitizeSignupForm(JSON.parse(saved)));
      }}>Save signup fixture</button>
      {!signupPreview && <SignupDesignPanel form={signupForm} onChange={setSignupForm} onUseTheme={() => {}} />}
    </aside>
    <main className="fixtureSignup"><SignupPageRenderer form={signupForm} /></main>
  </>;
  return <>
    {showPicker && <aside><HolidayBackgroundPicker designId={designId}
      value={choice || getHolidayBackgroundChoice(background.id, "template")}
      onChange={setChoice} /></aside>}
    <HolidayPageBackground background={background} className="fixturePage" style={{ fontFamily: design.font }}>
      <ThemedEventHeader design={design}>
        <div className="fixtureArtwork"><img src={design.artwork} alt="Original template artwork" /></div>
        <div><p className="eyebrow">{design.label}</p><h1>{design.coverTitle}</h1><p>Gather together for this occasion.</p></div>
      </ThemedEventHeader>
      <TemplateBodyLayout presentation={getGeneralEventBodyPresentation(designId)}
        style={{ "--body-tint": background.surface } as import("react").CSSProperties} sections={[
        { id: "details", content: <section><h2>Event details</h2><p>Your date, location and plans appear here.</p></section> },
        { id: "notes", content: <section><h2>Good to know</h2><p>A readable place for the information your guests need.</p></section> },
      ]} />
      <footer>Envitefy</footer>
    </HolidayPageBackground>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
