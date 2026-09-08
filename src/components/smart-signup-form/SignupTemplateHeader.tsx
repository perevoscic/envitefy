import type { ReactNode } from "react";
import type { SignupForm } from "@/types/signup";

/** The public form header, shared with template previews. */
export default function SignupTemplateHeader({ form, fallbackTitle, children, actions }: { form: SignupForm; fallbackTitle?: string; children?: ReactNode; actions?: ReactNode }) {
  const header = form.header;
  const layout = header?.templateId || "header-1";
  const side = layout === "header-1" || layout === "header-2" || layout === "header-4";
  const gallery = layout === "header-5" || layout === "header-6";
  const images = gallery ? (header?.images || []).slice(0, layout === "header-6" ? 3 : 2) : header?.backgroundImage ? [header.backgroundImage] : [];
  return <section className="overflow-hidden rounded-xl border" style={{ backgroundColor: header?.backgroundColor || undefined, backgroundImage: header?.backgroundCss || undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
    <div className="px-5 py-6">
      <div className={`grid items-start gap-4 ${side ? layout === "header-2" ? "md:grid-cols-[1fr_325px]" : "md:grid-cols-[325px_1fr]" : "grid-cols-1"}`}>
        {!!images.length && <div className={`${layout === "header-2" ? "md:order-2" : ""} ${gallery ? layout === "header-6" ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3" : ""}`}>
          {images.map((image, index) => <img key={`${image.dataUrl}-${index}`} src={image.dataUrl} alt="" className={`w-full rounded-xl border object-cover ${side ? "max-h-[325px] max-w-[325px]" : gallery ? "h-36" : "max-h-80"}`} />)}
        </div>}
        <div className="flex flex-col gap-2">
          {header?.groupName && <p className="text-sm font-semibold" style={{ color: header.textColor1 || undefined }}>{header.groupName}</p>}
          <h1 className="text-2xl font-semibold" style={{ color: header?.textColor2 || undefined }}>{form.title || fallbackTitle || "Smart sign-up"}</h1>
          {children}
        </div>
      </div>
      {form.description && <p className="mt-3 text-sm leading-relaxed" style={{ color: header?.textColor1 || undefined }}>{form.description}</p>}
      {actions && <div className="mt-4 border-t border-border/60 pt-3">{actions}</div>}
    </div>
  </section>;
}
