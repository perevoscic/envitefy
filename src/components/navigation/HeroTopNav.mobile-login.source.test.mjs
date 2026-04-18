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
  assert.match(source, /if \(!mobileMenuOpen\) {\s*setMobileLoginExpanded\(false\);/s);
  assert.match(source, /onClick=\{\(\) => setMobileLoginExpanded\(\(value\) => !value\)\}/);
  assert.match(source, /id="hero-top-nav-mobile-login"/);
  assert.match(source, /mobileMenuOpen \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(source, /mobileMenuOpen\s*\?\s*"visible translate-y-0 opacity-100"\s*:\s*"invisible -translate-y-2 opacity-0"/);
  assert.match(source, /<LoginForm\s+variant="inline"/);
  assert.match(source, /inlineTone=\{isDarkGlass \? "dark" : "light"\}/);
  assert.match(source, /showGoogleAuth=\{false\}/);
  assert.match(source, /successRedirectUrl=\{loginSuccessRedirectUrl\}/);
  assert.match(
    source,
    /onClick=\{\(\) => {\s*setMobileMenuOpen\(false\);\s*setMobileLoginExpanded\(false\);\s*onGuestPrimaryAction\(\);/s,
  );
  assert.match(source, /onClick=\{onGuestLoginAction\}/);
});
