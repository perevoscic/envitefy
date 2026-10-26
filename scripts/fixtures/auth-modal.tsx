import { useState } from "react";
import { createRoot } from "react-dom/client";
import AuthModal from "@/components/auth/AuthModal";

function Fixture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [action, setAction] = useState<"publish" | undefined>();
  return <>
    <button onClick={() => { setAction(undefined); setMode("signup"); setOpen(true); }}>Open signup</button>
    <button onClick={() => { setAction(undefined); setMode("login"); setOpen(true); }}>Open login</button>
    <button onClick={() => { setAction("publish"); setMode("signup"); setOpen(true); }}>Open publish signup</button>
    <button onClick={() => { setAction("publish"); setMode("login"); setOpen(true); }}>Open publish login</button>
    <AuthModal open={open} action={action} mode={mode} onClose={() => setOpen(false)} onModeChange={setMode} />
  </>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
