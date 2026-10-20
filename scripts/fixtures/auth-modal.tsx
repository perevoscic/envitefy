import { useState } from "react";
import { createRoot } from "react-dom/client";
import AuthModal from "@/components/auth/AuthModal";

function Fixture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  return <>
    <button onClick={() => { setMode("signup"); setOpen(true); }}>Open signup</button>
    <button onClick={() => { setMode("login"); setOpen(true); }}>Open login</button>
    <AuthModal open={open} mode={mode} onClose={() => setOpen(false)} onModeChange={setMode} />
  </>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
