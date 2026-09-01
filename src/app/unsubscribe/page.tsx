import Link from "next/link";
import { verifyMarketingUnsubscribeToken } from "@/lib/marketing-unsubscribe";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token || "";
  const email = await verifyMarketingUnsubscribeToken(token);

  return (
    <main className="min-h-screen bg-[#fcfbf7] px-4 py-20 text-[#241c2b]">
      <section className="mx-auto max-w-lg rounded-2xl border border-[#d7c5a5] bg-white p-7 shadow-[0_24px_70px_rgba(33,26,35,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2f6f64]">Email choices</p>
        <h1 className="mt-3 text-3xl font-semibold">Unsubscribe from marketing</h1>
        {email ? (
          <>
            <p className="mt-4 leading-7 text-[#665d68]">
              Stop promotional and product-update emails to <strong>{email}</strong>. Essential
              account, security, RSVP, and event-service messages may still be sent.
            </p>
            <form method="post" action={`/api/email/unsubscribe?token=${encodeURIComponent(token)}`}>
              <button
                type="submit"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#203137] px-6 font-semibold text-white hover:bg-[#2b4148]"
              >
                Confirm unsubscribe
              </button>
            </form>
          </>
        ) : (
          <p className="mt-4 leading-7 text-[#665d68]">
            This unsubscribe link is invalid or expired. Use the contact page and we will update
            your preference.
          </p>
        )}
        <Link href="/contact" className="mt-6 inline-block font-semibold underline underline-offset-4">
          Contact Envitefy
        </Link>
      </section>
    </main>
  );
}
