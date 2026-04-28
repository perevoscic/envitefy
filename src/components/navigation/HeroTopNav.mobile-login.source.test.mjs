import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("HeroTopNav keeps desktop auth actions while using inline login inside the mobile menu", () => {
  const source = readSource("src/components/navigation/HeroTopNav.tsx");

  assert.match(source, /import LoginForm from "@\/components\/auth\/LoginForm";/);
  assert.match(source, /import \{ motion \} from "framer-motion";/);
  assert.match(source, /import \{ createPortal \} from "react-dom";/);
  assert.match(source, /loginSuccessRedirectUrl\?: string;/);
  assert.match(source, /draggable=\{false\}/);
  assert.match(
    source,
    /const \[mobileLoginExpanded, setMobileLoginExpanded\] = useState\(false\);/,
  );
  assert.match(
    source,
    /const \[mobileMenuPortalReady, setMobileMenuPortalReady\] = useState\(false\);/,
  );
  assert.match(source, /const mobileMenuCardRef = useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(source, /const mobileMenuToggleRef = useRef<HTMLButtonElement \| null>\(null\);/);
  assert.match(source, /const mobileMenuDragStartX = useRef<number \| null>\(null\);/);
  assert.match(source, /const mobileMenuSwipeStartX = useRef<number \| null>\(null\);/);
  assert.match(
    source,
    /const showMobileGuestActions =\s*status !== "authenticated" && !mobileLoginExpanded;/,
  );
  assert.match(source, /setMobileMenuPortalReady\(true\);/);
  assert.match(source, /document\.addEventListener\("pointerdown", handlePointerDown\);/);
  assert.match(source, /if \(mobileMenuCardRef\.current\?\.contains\(target\)\) return;/);
  assert.match(source, /if \(mobileMenuToggleRef\.current\?\.contains\(target\)\) return;/);
  assert.match(source, /setMobileMenuOpen\(false\);\s*setMobileLoginExpanded\(false\);/s);
  assert.match(source, /const scrollY = window\.scrollY;/);
  assert.match(source, /const \{ body, documentElement \} = document;/);
  assert.match(source, /const previousHtmlOverflow = documentElement\.style\.overflow;/);
  assert.match(source, /const previousBodyPosition = body\.style\.position;/);
  assert.match(source, /documentElement\.style\.overflow = "hidden";/);
  assert.match(source, /documentElement\.style\.overscrollBehavior = "none";/);
  assert.match(source, /body\.style\.overflow = "hidden";/);
  assert.match(source, /body\.style\.position = "fixed";/);
  assert.match(source, /body\.style\.top = `-\$\{scrollY\}px`;/);
  assert.match(source, /window\.scrollTo\(0, scrollY\);/);
  assert.match(source, /if \(!mobileMenuOpen\) {\s*setMobileLoginExpanded\(false\);/s);
  assert.match(
    source,
    /showMobileGuestActions \? \(\s*<button[\s\S]*onClick=\{\(\) => setMobileLoginExpanded\(\(value\) => !value\)\}/s,
  );
  assert.match(source, /id="hero-top-nav-mobile"/);
  assert.match(source, /createPortal\(/);
  assert.match(source, /document\.body/);
  assert.match(source, /<motion\.div/);
  assert.match(source, /initial=\{false\}/);
  assert.match(source, /x: mobileMenuOpen \? 0 : "100%"/);
  assert.match(source, /opacity: mobileMenuOpen \? 1 : 0/);
  assert.match(source, /type: "spring"/);
  assert.match(source, /drag=\{mobileMenuOpen \? "x" : false\}/);
  assert.match(source, /dragConstraints=\{\{ left: 0, right: 0 \}\}/);
  assert.match(source, /dragElastic=\{0\.1\}/);
  assert.match(source, /onPointerDownCapture=\{\(event\) => \{/);
  assert.match(source, /mobileMenuSwipeStartX\.current = event\.clientX;/);
  assert.match(source, /onPointerUpCapture=\{\(event\) => \{/);
  assert.match(source, /event\.clientX - swipeStartX > 100/);
  assert.match(source, /onDragStart=\{\(_event, info\) => \{/);
  assert.match(source, /mobileMenuDragStartX\.current = info\.point\.x;/);
  assert.match(source, /const dragDistanceX =/);
  assert.match(source, /info\.point\.x - dragStartX/);
  assert.match(source, /if \(dragDistanceX > 100\) \{/);
  assert.match(source, /"!fixed inset-0 z-\[1000\] h-dvh w-screen touch-pan-y !overflow-y-auto/);
  assert.match(source, /overscroll-y-contain/);
  assert.match(source, /\[-webkit-overflow-scrolling:touch\]/);
  assert.match(source, /will-change-transform/);
  assert.match(source, /mobileMenuOpen \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(
    source,
    /"bg-\[linear-gradient\(180deg,#faf7ff_0%,#f4efff_100%\)\] text-\[#31264f\]/,
  );
  assert.match(source, /tone="gradient"/);
  assert.match(source, /"hero-top-nav-brand-light"/);
  assert.match(source, /"nav-chrome-pill-secondary text-\[#31264f\]"/);
  assert.match(source, /"mt-8 flex flex-1 flex-col items-end justify-start/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-label="Close navigation"/);
  assert.match(source, /id="hero-top-nav-mobile-login"/);
  assert.match(source, /ref=\{mobileMenuToggleRef\}/);
  assert.match(source, /ref=\{mobileMenuCardRef\}/);
  assert.match(source, /"rounded-\[1\.35rem\] px-4 py-4"/);
  assert.match(source, /<LoginForm\s+variant="inline"/);
  assert.match(source, /onInlineCancel=\{\(\) => setMobileLoginExpanded\(false\)\}/);
  assert.match(source, /inlineTone="light"/);
  assert.match(source, /successRedirectUrl=\{loginSuccessRedirectUrl\}/);
  assert.match(
    source,
    /onClick=\{\(\) => {\s*setMobileMenuOpen\(false\);\s*setMobileLoginExpanded\(false\);\s*onGuestPrimaryAction\(\);/s,
  );
  assert.match(source, /\) : showMobileGuestActions \? \(\s*<button/s);
  assert.match(source, /onClick=\{onGuestLoginAction\}/);
});
