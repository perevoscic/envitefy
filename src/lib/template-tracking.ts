import { hasAnalyticsConsent } from "./privacy-preferences";

export function trackTemplateEvent(name: string, category: string, templateId?: string) {
  if (hasAnalyticsConsent() && typeof window.gtag === "function")
    window.gtag("event", name, { category, template_id: templateId });
}
