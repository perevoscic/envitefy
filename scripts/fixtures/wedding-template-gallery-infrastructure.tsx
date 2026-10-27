import headerStyles from "../../src/components/navigation/public-landing-header.module.css";
import EnvitefyBrandImage from "../../src/components/branding/EnvitefyBrandImage";
import { ENVITEFY_BRAND_ASSETS } from "../../src/lib/brand-assets";

// Navigation behavior and the custom-design dialogs have independent browser
// suites. This probe uses the real header CSS so the wedding gallery's header
// palette overrides are exercised alongside its real hero and native controls.
export default function OmittedInfrastructure(props: {
  open?: boolean;
  mode?: string;
  category?: string;
  onClose?: () => void;
}) {
  if (props.mode) return props.open ? (
    <div role="dialog" aria-label="Fixture account dialog" data-fixture-auth-modal>
      <button type="button" onClick={props.onClose}>Close account dialog</button>
    </div>
  ) : null;
  if (props.category) return (
    <div role="dialog" aria-label="Fixture custom design dialog" data-fixture-custom-dialog={props.category}>
      <button type="button" onClick={props.onClose}>Close design dialog</button>
    </div>
  );
  return (
    <header className={headerStyles.header} data-public-landing-header data-fixture-header-probe>
      <div className={headerStyles.inner}>
        <a href="/" className={headerStyles.brand} aria-label="Envitefy home">
          <EnvitefyBrandImage src={ENVITEFY_BRAND_ASSETS.wordmark.color} whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white} alt="Envitefy" width={150} height={55} />
        </a>
        <nav className={headerStyles.nav} aria-label="Fixture public navigation">
          <a href="/weddings/templates" className={headerStyles.navLink} aria-current="page">Templates</a>
          <a href="/#how-it-works" className={headerStyles.navLink}>How it works</a>
        </nav>
        <div className={headerStyles.actions}>
          <button type="button" className={headerStyles.join} data-header-join>Sign in</button>
          <button type="button" className={headerStyles.primary} data-header-primary>Create with Envitefy</button>
        </div>
      </div>
    </header>
  );
}
