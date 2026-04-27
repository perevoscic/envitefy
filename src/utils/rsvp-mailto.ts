export function isRsvpMailtoHref(href: string | null | undefined): href is string {
  return typeof href === "string" && href.trim().toLowerCase().startsWith("mailto:");
}

type RsvpMailPlatform = "ios" | "mac" | "other";

type RsvpMailNavigator = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

type RsvpMailAppChoice = {
  id: "default" | "gmail" | "outlook";
  label: string;
  detail: string;
  href: string;
  fallbackHref?: string;
};

const CHOOSER_ID = "envitefy-rsvp-mailto-chooser";

export function getRsvpMailPlatform(nav?: RsvpMailNavigator | null): RsvpMailPlatform {
  const source = nav ?? (typeof navigator !== "undefined" ? navigator : null);
  if (!source) return "other";

  const userAgent = source.userAgent || "";
  const platform = source.platform || "";
  const maxTouchPoints = source.maxTouchPoints || 0;
  const isiPadOS = platform === "MacIntel" && maxTouchPoints > 1;

  if (/\b(iPad|iPhone|iPod)\b/i.test(userAgent) || isiPadOS) return "ios";
  if (/^Mac/i.test(platform)) return "mac";
  return "other";
}

function parseMailtoHref(href: string) {
  const withoutScheme = href.trim().replace(/^mailto:/i, "");
  const queryIndex = withoutScheme.indexOf("?");
  const address = queryIndex >= 0 ? withoutScheme.slice(0, queryIndex) : withoutScheme;
  const query = queryIndex >= 0 ? withoutScheme.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);

  return {
    to: decodeURIComponent(address).trim(),
    subject: params.get("subject") || "",
    body: params.get("body") || "",
  };
}

function buildAppComposeHref(
  scheme: "googlegmail://co" | "ms-outlook://compose",
  mailtoHref: string,
) {
  const parsed = parseMailtoHref(mailtoHref);
  const params = new URLSearchParams();
  if (parsed.to) params.set("to", parsed.to);
  if (parsed.subject) params.set("subject", parsed.subject);
  if (parsed.body) params.set("body", parsed.body);
  const query = params.toString();
  return query ? `${scheme}?${query}` : scheme;
}

export function buildRsvpMailAppChoices(mailtoHref: string): RsvpMailAppChoice[] {
  return [
    {
      id: "default",
      label: "Default Mail",
      detail: "Use the mail app selected in iOS or iPadOS settings.",
      href: mailtoHref,
    },
    {
      id: "gmail",
      label: "Gmail",
      detail: "Open the draft in Gmail when it is installed.",
      href: buildAppComposeHref("googlegmail://co", mailtoHref),
      fallbackHref: mailtoHref,
    },
    {
      id: "outlook",
      label: "Outlook",
      detail: "Open the draft in Outlook when it is installed.",
      href: buildAppComposeHref("ms-outlook://compose", mailtoHref),
      fallbackHref: mailtoHref,
    },
  ];
}

function openHrefInCurrentContext(href: string): boolean {
  try {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_self";
    anchor.rel = "noopener";
    anchor.style.display = "none";
    anchor.setAttribute("aria-hidden", "true");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    window.location.href = href;
    return true;
  }
}

function openAppHrefWithFallback(href: string, fallbackHref?: string) {
  if (!fallbackHref || href === fallbackHref) {
    openHrefInCurrentContext(href);
    return;
  }

  let settled = false;
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      settled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (!settled) openHrefInCurrentContext(fallbackHref);
  }, 900);

  openHrefInCurrentContext(href);
}

function closeExistingChooser() {
  document.getElementById(CHOOSER_ID)?.remove();
}

function openIosMailChooser(mailtoHref: string) {
  closeExistingChooser();

  const choices = buildRsvpMailAppChoices(mailtoHref);
  const overlay = document.createElement("div");
  overlay.id = CHOOSER_ID;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Choose mail app");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:flex",
    "align-items:flex-end",
    "justify-content:center",
    "padding:16px",
    "background:rgba(15,23,42,0.48)",
    "font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(";");

  const panel = document.createElement("div");
  panel.style.cssText = [
    "width:min(100%,420px)",
    "border-radius:24px",
    "background:#fff",
    "box-shadow:0 24px 80px rgba(15,23,42,0.32)",
    "padding:18px",
    "color:#111827",
  ].join(";");

  const title = document.createElement("h2");
  title.textContent = "Choose mail app";
  title.style.cssText = "margin:0 0 6px;font-size:18px;line-height:1.2;font-weight:800";

  const note = document.createElement("p");
  note.textContent =
    "Pick where to open the RSVP draft. If an app is not installed, Default Mail will open instead.";
  note.style.cssText = "margin:0 0 14px;font-size:13px;line-height:1.45;color:#64748b";

  panel.append(title, note);

  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.style.cssText = [
      "width:100%",
      "display:flex",
      "flex-direction:column",
      "gap:3px",
      "border:1px solid #e5e7eb",
      "border-radius:16px",
      "background:#fff",
      "padding:13px 14px",
      "margin-top:8px",
      "text-align:left",
      "color:#111827",
      "font:inherit",
    ].join(";");
    const label = document.createElement("span");
    label.textContent = choice.label;
    label.style.cssText = "font-size:15px;font-weight:800";
    const detail = document.createElement("span");
    detail.textContent = choice.detail;
    detail.style.cssText = "font-size:12px;line-height:1.35;color:#64748b";
    button.append(label, detail);
    button.addEventListener("click", () => {
      closeExistingChooser();
      openAppHrefWithFallback(choice.href, choice.fallbackHref);
    });
    panel.appendChild(button);
  }

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.style.cssText = [
    "width:100%",
    "border:0",
    "border-radius:16px",
    "background:#f1f5f9",
    "padding:13px 14px",
    "margin-top:10px",
    "color:#334155",
    "font:inherit",
    "font-size:14px",
    "font-weight:800",
  ].join(";");
  cancel.addEventListener("click", closeExistingChooser);
  panel.appendChild(cancel);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeExistingChooser();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") closeExistingChooser();
    },
    { once: true },
  );

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

export function openRsvpMailtoHref(href: string | null | undefined): boolean {
  if (typeof window === "undefined" || !isRsvpMailtoHref(href)) return false;

  const mailtoHref = href.trim();
  if (getRsvpMailPlatform() === "ios") {
    openIosMailChooser(mailtoHref);
    return true;
  }

  return openHrefInCurrentContext(mailtoHref);
}
