import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import styles from "./signup-theme.module.css";

export default function SignupFormFooter({ inverse = false }: { inverse?: boolean }) {
  return (
    <footer className={styles.formFooter}>
      <EnvitefyEventBranding category="Sign-up Forms" inverse={inverse} />
    </footer>
  );
}
