import type { Metadata } from "next";
import GymnasticsLauncher from "@/components/event-create/GymnasticsLauncher";

export const metadata: Metadata = {
  title: "Gymnastics Meet Pages | Envitefy",
  description:
    "Upload gymnastics meet information once and turn it into a clean, shareable meet page for parents, athletes, coaches, and spectators.",
};

export default function GymnasticsLandingPage() {
  return <GymnasticsLauncher />;
}
