type Props = {
  mode: "login" | "signup";
  successRedirectUrl?: string;
  onSwitchMode?: () => void;
};
export default function MockAuthForm({ mode, successRedirectUrl = "/", onSwitchMode }: Props) {
  return (
    <form
      aria-label={mode === "signup" ? "Fixture signup" : "Fixture login"}
      data-auth-redirect={successRedirectUrl}
      onSubmit={(event) => {
        event.preventDefault();
        window.__landingProductAuth.push({ mode, redirect: successRedirectUrl });
      }}
    >
      <label>
        Email
        <input type="email" name="email" required defaultValue="host@example.test" />
      </label>
      <button type="submit">{mode === "signup" ? "Create account" : "Sign in"}</button>
      <button type="button" onClick={onSwitchMode}>
        {mode === "signup" ? "Switch to login" : "Switch to signup"}
      </button>
    </form>
  );
}
