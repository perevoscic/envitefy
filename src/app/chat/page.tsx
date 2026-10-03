import { redirect } from "next/navigation";

/** Retired creation chat links return to the dashboard. */
export default function ChatPage() {
  redirect("/");
}
