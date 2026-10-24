import MockAuthForm from "./MockAuthForm";
export default function LoginForm(props: any) {
  return <MockAuthForm {...props} mode="login" />;
}
