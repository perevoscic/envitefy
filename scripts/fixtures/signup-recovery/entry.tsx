import { createRoot } from "react-dom/client";
import SignupRecovery from "../../../src/components/smart-signup-form/SignupRecovery";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <main className="mx-auto max-w-3xl p-4 sm:p-8">
    <h1 className="mb-6 text-2xl font-semibold">Community signup</h1>
    <SignupRecovery eventId="qa-signup" />
  </main>,
);
