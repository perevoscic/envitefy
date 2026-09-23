import { createRoot } from "react-dom/client";
import AccountDeletionRequestForm from "../../../src/components/account/AccountDeletionRequestForm";
import ProfileAccountDeletion from "../../../src/components/account/ProfileAccountDeletion";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <main className="mx-auto max-w-2xl bg-white p-5 text-slate-900">
    <h1 className="mb-6 text-2xl font-bold">Envitefy account settings</h1>
    {window.location.search.includes("public") ? <AccountDeletionRequestForm /> : <ProfileAccountDeletion accountEmail="owner@example.test" />}
  </main>,
);
