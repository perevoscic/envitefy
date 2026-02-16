import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Envitefy",
  description:
    "Envitefy turns school flyers, invites, and schedules into calendar events in seconds — built for busy parents.",
  openGraph: {
    title: "About — Envitefy",
    description:
      "Envitefy turns school flyers, invites, and schedules into calendar events in seconds — built for busy parents.",
    url: "https://envitefy.com/about",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl bg-gradient-to-br from-white to-[#f8f4ff] border border-[#e5dcff] p-6 hover:border-[#cfc2ff] hover:shadow-lg transition-all duration-300">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-foreground/70 leading-relaxed">{description}</p>
  </div>
);

const FeatureList = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">
    {items.map((item, idx) => (
      <li key={idx} className="flex items-start gap-3 text-foreground/80">
        <svg
          className="w-5 h-5 text-[#7F8CFF] mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] text-foreground py-12 px-4 sm:px-6">
      <section className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] rounded-3xl p-1 mb-8">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-10 sm:p-12 border border-[#e5dcff]">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.18] tracking-tight pb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5a56d6] via-[#7F8CFF] to-[#9a84ff]">
                  About
                  <span> </span>
                  <span className="font-pacifico inline-block">Envitefy</span>
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg uppercase tracking-[0.2em] text-foreground/60 font-medium">
                Snap it. Save it. Stay organized.
              </p>
              <p className="mt-8 text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                Envitefy was built by parents who were tired of digging through
                backpacks and group chats. Snap a picture of any flyer, invite,
                practice chart, or appointment card and we turn it into a clean
                calendar event with the right title, place, and reminders — no
                typing and no guesswork.
              </p>
            </div>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-[#5a56d6] to-[#8a78f8]">
            Powerful Features for Busy Families
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="📸"
              title="Advanced OCR Technology"
              description="Powered by OpenAI Vision with Google Vision fallback. Reads cursive handwriting, decorative fonts, and complex layouts with remarkable accuracy."
            />
            <FeatureCard
              icon="🎨"
              title="14+ Event Templates"
              description="Specialized templates for Birthdays, Weddings, Baby Showers, Sports, Appointments, and more. Each designed for its unique use case."
            />
            <FeatureCard
              icon="📅"
              title="Multi-Calendar Sync"
              description="Add events to Google Calendar, Microsoft Outlook, and Apple Calendar simultaneously. One tap, multiple calendars updated."
            />
            <FeatureCard
              icon="🎁"
              title="Registry Integration"
              description="Link gift registries from Amazon, Target, Walmart, Babylist, and MyRegistry directly in your event pages for Birthdays, Weddings, and Baby Showers."
            />
            <FeatureCard
              icon="⚽"
              title="Sports-Specific Templates"
              description="Football Season, Soccer, Gymnastics, Cheerleading, Dance/Ballet templates with rosters, practice schedules, and game tracking."
            />
            <FeatureCard
              icon="🔄"
              title="Recurring Events"
              description="Automatically converts weekly practice schedules into recurring calendar events. Season flyers become complete schedules in one file."
            />
            <FeatureCard
              icon="👥"
              title="RSVP & Attendance"
              description="Track RSVPs and attendance with roster management. Perfect for team events, parties, and gatherings with guest lists."
            />
            <FeatureCard
              icon="📝"
              title="Smart Sign-Up Forms"
              description="Volunteer slots, snack sign-ups, and custom forms with automatic waitlisting and capacity management."
            />
            <FeatureCard
              icon="🔗"
              title="Event Sharing"
              description="Share events with other users. Perfect for coaches sharing schedules or families coordinating celebrations."
            />
            <FeatureCard
              icon="💝"
              title="Gift Subscriptions"
              description="Gift paid months to friends, coaches, or family members. We handle the delivery and activation automatically."
            />
            <FeatureCard
              icon="📱"
              title="Cross-Device Sync"
              description="Access your event history and settings from any device. Your data stays in sync wherever you go."
            />
            <FeatureCard
              icon="🏷️"
              title="Custom Categories"
              description="Create your own event categories with custom icons. Organize events your way with personalized color coding."
            />
          </div>
        </div>

        {/* Event Templates Section */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-white to-[#f8f4ff] border border-[#e5dcff] p-8 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Comprehensive Event Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-[#6d5eea]">
                Life Milestones & Celebrations
              </h3>
              <FeatureList
                items={[
                  "Birthdays with registry support",
                  "Weddings with gift registries",
                  "Baby Showers with registry links",
                  "Gender Reveal parties",
                ]}
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-[#6d5eea]">
                Sports & Activities
              </h3>
              <FeatureList
                items={[
                  "Football Season & Practice",
                  "Soccer with lineup tracking",
                  "Gymnastics schedules",
                  "Cheerleading events",
                  "Dance & Ballet classes",
                  "General sport events",
                ]}
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-[#6d5eea]">
                Appointments & Classes
              </h3>
              <FeatureList
                items={[
                  "Doctor & medical appointments",
                  "Workshops & classes",
                  "General events",
                  "Special events",
                ]}
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-[#6d5eea]">
                Advanced Features
              </h3>
              <FeatureList
                items={[
                  "Team rosters with contact info",
                  "Practice schedule automation",
                  "Travel & logistics planning",
                  "Equipment checklists",
                  "Volunteer coordination",
                ]}
              />
            </div>
          </div>
        </div>

        {/* Technology & Accuracy */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-white to-[#f8f4ff] border border-[#e5dcff] p-8 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Built for Real Life
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Intelligent Recognition
              </h3>
              <ul className="space-y-3 text-foreground/80">
                <li>• Reads names in cursive and decorative fonts</li>
                <li>• Understands spelled-out times (&quot;four o&apos;clock&quot;)</li>
                <li>• Distinguishes home vs. away games</li>
                <li>• Extracts RSVP contact information</li>
                <li>• Recognizes event categories automatically</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Seamless Workflow
              </h3>
              <ul className="space-y-3 text-foreground/80">
                <li>• Snap or upload — works with photos and PDFs</li>
                <li>• One-tap calendar integration</li>
                <li>• Bulk import for season schedules</li>
                <li>• Share entire seasons in one file</li>
                <li>• Automatic timezone detection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What Families Love */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-white to-[#f8f4ff] border border-[#e5dcff] p-8 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            What Families Love
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/40">
              <div className="text-3xl">🌅</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Calm Mornings</h3>
                <p className="text-foreground/70">
                  Events land on your calendar before the bells ring, so the
                  whole household knows where to be.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/40">
              <div className="text-3xl">💌</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Every Invitation Covered
                </h3>
                <p className="text-foreground/70">
                  Handles weddings, showers, and milestone birthdays without
                  generic filler, keeping wording true to the card.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/40">
              <div className="text-3xl">👨‍👩‍👧‍👦</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Team & Club Friendly
                </h3>
                <p className="text-foreground/70">
                  Save one clean file with every meet or match, then text or
                  email it to other parents in seconds.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface/40">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Thoughtful Gifts</h3>
                <p className="text-foreground/70">
                  Send a friend or coach a bundle of paid months and we&apos;ll
                  deliver a ready-to-use gift message when payment clears.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-white to-[#f8f4ff] border border-[#e5dcff] p-8 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Our Story
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 text-lg text-foreground/80 leading-relaxed">
            <p>
              We started Envitefy as parents juggling concerts, practices,
              appointments, and invites across group chats and crumpled flyers.
              We knew there had to be a better way.
            </p>
            <p>
              We obsessed over accuracy — script names, spelled-out times, home
              vs. away — so the saved event feels like the original. Every
              detail matters when you&apos;re coordinating a busy family schedule.
            </p>
            <p>
              Today, families, coaches, and club organizers use Envitefy to stay
              in sync without extra typing. From kindergarten concerts to travel
              tournaments, we&apos;re here to make event management effortless.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-tr from-[#efe8ff] via-white to-[#f4edff] rounded-3xl p-8 sm:p-10 border border-[#d9ceff]">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of families who are already using Envitefy to
              simplify their event management and stay organized.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-semibold bg-[#7F8CFF] hover:bg-[#6d7af5] active:bg-[#5e69d9] text-white shadow-lg shadow-[#7F8CFF]/25 transition-all duration-200"
              >
                Start Snapping Events
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-semibold border-2 border-[#d9ceff] text-[#433b66] hover:text-[#2f2850] hover:border-[#c6b8ff] bg-white transition-all duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
