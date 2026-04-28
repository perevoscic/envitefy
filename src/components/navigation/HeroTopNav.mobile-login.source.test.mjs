import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("HeroTopNav keeps desktop auth actions while using inline login inside the mobile menu", () => {
  const source = readSource("src/components/navigation/HeroTopNav.tsx");

  assert.match(source, /import LoginForm from "@\/components\/auth\/LoginForm";/);
  assert.match(source, /loginSuccessRedirectUrl\?: string;/);
  assert.match(source, /const \[mobileLoginExpanded, setMobileLoginExpanded\] = useState\(false\);/);
  assert.match(source, /const mobileMenuCardRef = useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(source, /const mobileMenuToggleRef = useRef<HTMLButtonElement \| null>\(null\);/);
  assert.match(source, /const showMobileGuestActions =\s*status !== "authenticated" && !mobileLoginExpanded;/);
  assert.match(source, /document\.addEventListener\("pointerdown", handlePointerDown\);/);
  assert.match(source, /if \(mobileMenuCardRef\.current\?\.contains\(target\)\) return;/);
  assert.match(source, /if \(mobileMenuToggleRef\.current\?\.contains\(target\)\) return;/);
  assert.match(source, /setMobileMenuOpen\(false\);\s*setMobileLoginExpanded\(false\);/s);
  assert.match(source, /if \(!mobileMenuOpen\) {\s*setMobileLoginExpanded\(false\);/s);
  assert.match(source, /showMobileGuestActions \? \(\s*<button[\s\S]*onClick=\{\(\) => setMobileLoginExpanded\(\(value\) => !value\)\}/s);
  assert.match(source, /id="hero-top-nav-mobile-login"/);
  assert.match(source, /mobileMenuOpen \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(source, /ref=\{mobileMenuToggleRef\}/);
  assert.match(source, /ref=\{mobileMenuCardRef\}/);
  assert.match(source, /"rounded-\[1\.35rem\] px-4 py-4"/);
  assert.match(source, /<LoginForm\s+variant="inline"/);
  assert.match(source, /onInlineCancel=\{\(\) => setMobileLoginExpanded\(false\)\}/);
  assert.match(source, /inlineTone=\{isDarkGlass \? "dark" : "light"\}/);
  assert.match(source, /successRedirectUrl=\{loginSuccessRedirectUrl\}/);
  assert.match(
    source,
    /onClick=\{\(\) => {\s*setMobileMenuOpen\(false\);\s*setMobileLoginExpanded\(false\);\s*onGuestPrimaryAction\(\);/s,
  );
  assert.match(source, /\) : showMobileGuestActions \? \(\s*<button/s);
  assert.match(source, /onClick=\{onGuestLoginAction\}/);
});
