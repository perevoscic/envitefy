import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret, StripePlanId } from "@/lib/stripe";
import {
  attachPromoCodeToGiftOrder,
  createGiftPromoCode,
  getGiftOrderByCheckoutSessionId,
  getGiftOrderById,
  getGiftOrderByPaymentIntentId,
  getUserIdByEmail,
  getUserByStripeCustomerId,
  getUserByStripeSubscriptionId,
  markGiftOrderStatus,
  recordStripeWebhookEvent,
  revokePromoCodesByPaymentIntent,
  updateGiftOrderStripeRefs,
  updateUserStripeState,
} from "@/lib/db";
import { sendGiftEmail } from "@/lib/email";
import { getPlanFromPrice } from "@/lib/stripe-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = ["iad1", "cle1", "sfo1"];

async function parseEvent(req: NextRequest): Promise<{ event: Stripe.Event; rawBody: string }> {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Missing Stripe signature header");
  }
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  return { event, rawBody };
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadataType = session.metadata?.type || session.metadata?.Type;
  if (metadataType === "subscription") {
    const email = session.metadata?.userEmail || session.customer_details?.email || null;
    const userId = session.metadata?.userId || null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
    const identifier: { email?: string | null; userId?: string | null } = {};
    if (email) identifier.email = email;
    if (userId) identifier.userId = userId;
    if (identifier.email || identifier.userId) {
      await updateUserStripeState(identifier, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: null,
      });
    }
  } else if (metadataType === "gift") {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;
    await updateGiftOrderStripeRefs({
      orderId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    });
    const nextStatus = session.payment_status === "paid" ? "paid" : "pending";
    await markGiftOrderStatus({ orderId, status: nextStatus, stripePaymentIntentId: paymentIntentId || undefined });
  }
}

async function fulfillGiftOrderFromIntent(intent: Stripe.PaymentIntent) {
  const metadataType = intent.metadata?.type || intent.metadata?.Type;
  if (metadataType !== "gift") return;
  const orderId = intent.metadata?.orderId || null;
  const paymentIntentId = intent.id;
  console.log("[stripe webhook] fulfill gift intent", {
    paymentIntentId,
    orderId,
    status: intent.status,
  });
  const order = orderId
    ? await getGiftOrderById(orderId)
    : await getGiftOrderByPaymentIntentId(paymentIntentId);
  if (!order) {
    console.warn("[stripe webhook] gift order missing", { paymentIntentId, orderId });
    return;
  }
  console.log("[stripe webhook] gift order loaded", {
    orderId: order.id,
    status: order.status,
    hasRecipientEmail: Boolean(order.recipient_email),
  });
  if (!order || order.status === "fulfilled") return;

  const existingPromo = order.promo_code_id;
  if (existingPromo) {
    console.log("[stripe webhook] gift already fulfilled", { orderId: order.id, promoCodeId: existingPromo });
    await markGiftOrderStatus({ orderId: order.id, status: "fulfilled", stripePaymentIntentId: paymentIntentId });
    return;
  }

  const stripeCheckoutSessionId = order.stripe_checkout_session_id || (typeof intent.metadata?.checkoutSessionId === "string" ? intent.metadata?.checkoutSessionId : null);
  const stripeChargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : intent.latest_charge?.id || null;

  const orderMetadata = (order.metadata as any) || {};
  let createdByUserId: string | null = null;
  if (typeof orderMetadata?.purchaserUserId === "string" && orderMetadata.purchaserUserId.length > 0) {
    createdByUserId = orderMetadata.purchaserUserId;
  } else if (typeof orderMetadata?.createdByUserId === "string" && orderMetadata.createdByUserId.length > 0) {
    createdByUserId = orderMetadata.createdByUserId;
  }
  if (!createdByUserId && order.purchaser_email) {
    try {
      createdByUserId = await getUserIdByEmail(order.purchaser_email);
    } catch (err: any) {
      console.error("[stripe webhook] failed to lookup purchaser user id", {
        orderId: order.id,
        purchaserEmail: order.purchaser_email,
        error: err?.message,
      });
    }
  }

  const promo = await createGiftPromoCode({
    amountCents: order.amount_cents,
    currency: order.currency,
    createdByEmail: order.purchaser_email || null,
    createdByUserId,
    recipientName: order.recipient_name || null,
    recipientEmail: order.recipient_email || null,
    message: order.message || null,
    quantity: order.quantity,
    period: order.period === "years" ? "years" : "months",
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId,
    stripeChargeId,
    metadata: { giftOrderId: order.id },
  });

  console.log("[stripe webhook] promo code created", {
    orderId: order.id,
    promoCodeId: promo.id,
    createdByEmail: order.purchaser_email || null,
    createdByUserId,
  });

  await attachPromoCodeToGiftOrder({ orderId: order.id, promoCodeId: promo.id, status: "fulfilled" });
  await markGiftOrderStatus({
    orderId: order.id,
    status: "fulfilled",
    stripePaymentIntentId: paymentIntentId,
    metadataMerge: { promoCode: promo.code },
  });

  if (order.recipient_email) {
    const metadata = (order.metadata as any) || {};
    const senderName = metadata.senderFirstName || metadata.senderLastName ? `${metadata.senderFirstName || ""} ${metadata.senderLastName || ""}`.trim() : order.purchaser_name || null;
    let composedMessage = order.message || "";
    if (senderName) {
      const replyLine = `From: ${senderName}${order.purchaser_email ? ` <${order.purchaser_email}>` : ""}`;
      composedMessage = composedMessage ? `${composedMessage}\n\n${replyLine}` : replyLine;
    }
    console.log("[stripe webhook] sending gift email", {
      orderId: order.id,
      paymentIntentId,
      to: order.recipient_email,
      promoCode: promo.code,
    });
    await sendGiftEmail({
      toEmail: order.recipient_email,
      recipientName: order.recipient_name,
      fromEmail: order.purchaser_email || undefined,
      giftCode: promo.code,
      quantity: order.quantity || 0,
      period: order.period === "years" ? "years" : "months",
      message: composedMessage,
    });
  } else {
    console.warn("[stripe webhook] gift order missing recipient email", {
      orderId: order.id,
      paymentIntentId,
    });
  }
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  const metadataType = intent.metadata?.type || intent.metadata?.Type;
  if (metadataType !== "gift") return;
  const orderId = intent.metadata?.orderId || null;
  const order = orderId
    ? await getGiftOrderById(orderId)
    : await getGiftOrderByPaymentIntentId(intent.id);
  if (!order) return;
  await markGiftOrderStatus({ orderId: order.id, status: "failed", stripePaymentIntentId: intent.id });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || null;
  if (!paymentIntentId) return;
  await revokePromoCodesByPaymentIntent({
    paymentIntentId,
    refundId: charge.refunds?.data?.[0]?.id || null,
    metadata: { reason: charge.refunds?.data?.[0]?.reason || null, chargeId: charge.id },
  });
  const order = await getGiftOrderByPaymentIntentId(paymentIntentId);
  if (order) {
    await markGiftOrderStatus({
      orderId: order.id,
      status: "refunded",
      stripePaymentIntentId: paymentIntentId,
      stripeRefundId: charge.refunds?.data?.[0]?.id || null,
      metadataMerge: { refundedAmount: charge.amount_refunded },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id || null;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null;
  if (!subscriptionId) return;
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
  const subscriptionItems = subscription.items?.data ?? [];

  const rankedItems = subscriptionItems.filter((item) => !item.deleted && (item.quantity ?? 0) > 0);
  const scanItems = rankedItems.length > 0 ? rankedItems : subscriptionItems;

  let resolvedPlan: StripePlanId | null = null;
  let resolvedPrice: Stripe.Price | null = null;
  let resolvedPriceId: string | null = null;
  for (const item of scanItems) {
    const priceCandidate = item.price || null;
    if (!priceCandidate) continue;
    const candidatePlan = getPlanFromPrice(priceCandidate);
    if (!resolvedPrice) {
      resolvedPrice = priceCandidate;
      resolvedPriceId = priceCandidate.id || resolvedPriceId;
    }
    if (candidatePlan) {
      resolvedPlan = candidatePlan;
      resolvedPrice = priceCandidate;
      resolvedPriceId = priceCandidate.id || resolvedPriceId;
      break;
    }
  }

  if (!resolvedPlan) {
    for (const item of subscriptionItems) {
      const priceCandidate = item.price || null;
      if (!priceCandidate) continue;
      const candidatePlan = getPlanFromPrice(priceCandidate);
      if (candidatePlan) {
        resolvedPlan = candidatePlan;
        resolvedPrice = priceCandidate;
        resolvedPriceId = priceCandidate.id || resolvedPriceId;
        break;
      }
    }
  }

  if (!resolvedPlan) {
    const invoiceLines = invoice.lines?.data ?? [];
    for (const line of invoiceLines) {
      if (line.type && line.type !== "subscription") continue;
      const priceCandidate = typeof line.price === "string" ? null : line.price;
      const candidatePlan = getPlanFromPrice(priceCandidate || null);
      if (candidatePlan) {
        resolvedPlan = candidatePlan;
        resolvedPrice = priceCandidate || resolvedPrice;
        resolvedPriceId = priceCandidate?.id || (typeof line.price === "string" ? line.price : resolvedPriceId);
        break;
      }
      const interval = line.plan?.interval;
      if (interval === "year") {
        resolvedPlan = "yearly";
        resolvedPrice = priceCandidate || resolvedPrice;
        resolvedPriceId = priceCandidate?.id || (typeof line.price === "string" ? line.price : resolvedPriceId);
        break;
      }
      if (interval === "month") {
        resolvedPlan = "monthly";
        resolvedPrice = priceCandidate || resolvedPrice;
        resolvedPriceId = priceCandidate?.id || (typeof line.price === "string" ? line.price : resolvedPriceId);
        break;
      }
    }
  }

  const plan = resolvedPlan;
  const periodEnd = new Date(subscription.current_period_end * 1000);
  const targetUser =
    (customerId ? await getUserByStripeCustomerId(customerId) : null) ||
    (subscriptionId ? await getUserByStripeSubscriptionId(subscriptionId) : null);
  if (!targetUser) return;
  await updateUserStripeState(
    { email: targetUser.email },
    {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripePriceId: resolvedPrice?.id || resolvedPriceId || null,
      stripeCurrentPeriodEnd: periodEnd,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      subscriptionPlan: plan || targetUser.subscription_plan || null,
      subscriptionExpiresAt: periodEnd,
    }
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null;
  const targetUser =
    (subscription.id ? await getUserByStripeSubscriptionId(subscription.id) : null) ||
    (customerId ? await getUserByStripeCustomerId(customerId) : null);
  if (!targetUser) return;
  const endedAt = subscription.ended_at ? new Date(subscription.ended_at * 1000) : null;
  await updateUserStripeState(
    { email: targetUser.email },
    {
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: subscription.status,
      stripePriceId: null,
      stripeCurrentPeriodEnd: endedAt,
      stripeCancelAtPeriodEnd: false,
      subscriptionPlan: "free",
      subscriptionExpiresAt: endedAt,
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { event, rawBody } = await parseEvent(req);
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = event;
    }

    const recorded = await recordStripeWebhookEvent({
      eventId: event.id,
      type: event.type,
      payload,
    });
    if (!recorded) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await fulfillGiftOrderFromIntent(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[stripe/webhook] error", err);
    return NextResponse.json({ error: err?.message || "Webhook error" }, { status: 400 });
  }
}
