import { redirect } from "next/navigation";

export default function FootballPage() {
  redirect("/sport-events?sport=football");
}
