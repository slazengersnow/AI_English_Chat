import Stripe from "stripe";
import express, { Request, Response } from "express";

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.warn(
    "⚠️ Stripe secret key or webhook secret is missing. Skipping Stripe webhook route.",
  );
} else {
  // Stripeインスタンスを初期化
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-07-30.basil",
  });

  // Webhookルート
  router.post(
    "/",
    express.raw({ type: "application/json" }),
    (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string | undefined;

      let event: Stripe.Event;

      try {
        if (!sig) throw new Error("Missing Stripe signature header");
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("❌ Webhook signature verification failed.", err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      // イベント種別に応じて処理
      switch (event.type) {
        case "checkout.session.completed":
          handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case "payment_intent.succeeded":
          handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case "payment_intent.payment_failed":
          handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case "invoice.payment_succeeded":
          handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case "customer.subscription.created":
          handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case "customer.subscription.updated":
          handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case "customer.subscription.deleted":
          handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`⚠️ Unhandled event type: ${event.type}`);
      }

      res.status(200).send("Webhook received");
    },
  );
}

// 以下に各ハンドラー関数を定義（中身はダミーでOK、後で実装可能）

function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("✅ Checkout session completed:", session.id);
}

function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  console.log("✅ Payment intent succeeded:", intent.id);
}

function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  console.log("❌ Payment intent failed:", intent.id);
}

function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("✅ Invoice payment succeeded:", invoice.id);
}

function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("✅ Subscription created:", subscription.id);
}

function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("✅ Subscription updated:", subscription.id);
}

function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("✅ Subscription deleted:", subscription.id);
}

// ✅ これがないと import エラーになる！
export default router;
