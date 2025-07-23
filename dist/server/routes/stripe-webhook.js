import express from "express";
import Stripe from "stripe";
const router = express.Router();
// Stripeインスタンスを初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil", // 最新のAPI バージョンに更新
});
// Webhookルート（raw bodyで受け取る必要あり）
router.post("/", express.raw({ type: "application/json" }), // ★ここが重要
(req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        if (!sig) {
            throw new Error("Missing Stripe signature header");
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error("❌ Webhook signature verification failed.", err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // イベントの種類に応じて処理
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            console.log("✅ Checkout Session completed:", session);
            // ここに決済完了時の処理を追加
            // 例：データベースへの注文情報保存、メール送信など
            handleCheckoutSessionCompleted(session);
            break;
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            console.log("✅ Payment Intent succeeded:", paymentIntent);
            // 決済成功時の処理
            handlePaymentIntentSucceeded(paymentIntent);
            break;
        case "payment_intent.payment_failed":
            const failedPayment = event.data.object;
            console.log("❌ Payment Intent failed:", failedPayment);
            // 決済失敗時の処理
            handlePaymentIntentFailed(failedPayment);
            break;
        case "invoice.payment_succeeded":
            const invoice = event.data.object;
            console.log("✅ Invoice payment succeeded:", invoice);
            // 請求書決済成功時の処理
            handleInvoicePaymentSucceeded(invoice);
            break;
        case "customer.subscription.created":
            const subscription = event.data.object;
            console.log("✅ Subscription created:", subscription);
            // サブスクリプション作成時の処理
            handleSubscriptionCreated(subscription);
            break;
        case "customer.subscription.updated":
            const updatedSubscription = event.data.object;
            console.log("✅ Subscription updated:", updatedSubscription);
            // サブスクリプション更新時の処理
            handleSubscriptionUpdated(updatedSubscription);
            break;
        case "customer.subscription.deleted":
            const deletedSubscription = event.data.object;
            console.log("✅ Subscription deleted:", deletedSubscription);
            // サブスクリプション削除時の処理
            handleSubscriptionDeleted(deletedSubscription);
            break;
        default:
            console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
    res.status(200).send("Webhook received");
});
// チェックアウトセッション完了時の処理
async function handleCheckoutSessionCompleted(session) {
    try {
        console.log(`Processing checkout session: ${session.id}`);
        // 顧客情報の取得
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email;
        // 購入した商品情報の取得
        if (session.line_items) {
            // line_itemsが含まれている場合の処理
            console.log("Line items:", session.line_items);
        }
        // データベースへの注文情報保存
        // await saveOrderToDatabase({
        //   sessionId: session.id,
        //   customerId,
        //   customerEmail,
        //   amount: session.amount_total,
        //   currency: session.currency,
        //   status: session.payment_status
        // });
        // 確認メールの送信
        // await sendConfirmationEmail(customerEmail, session);
        console.log(`✅ Checkout session ${session.id} processed successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing checkout session ${session.id}:`, error);
    }
}
// 決済成功時の処理
async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        console.log(`Processing payment intent: ${paymentIntent.id}`);
        // 決済情報の更新
        // await updatePaymentStatus(paymentIntent.id, 'succeeded');
        console.log(`✅ Payment intent ${paymentIntent.id} processed successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing payment intent ${paymentIntent.id}:`, error);
    }
}
// 決済失敗時の処理
async function handlePaymentIntentFailed(paymentIntent) {
    try {
        console.log(`Processing failed payment intent: ${paymentIntent.id}`);
        // 決済失敗の記録
        // await updatePaymentStatus(paymentIntent.id, 'failed');
        // 失敗通知の送信
        // await sendPaymentFailedNotification(paymentIntent);
        console.log(`✅ Failed payment intent ${paymentIntent.id} processed`);
    }
    catch (error) {
        console.error(`❌ Error processing failed payment intent ${paymentIntent.id}:`, error);
    }
}
// 請求書決済成功時の処理
async function handleInvoicePaymentSucceeded(invoice) {
    try {
        console.log(`Processing invoice payment: ${invoice.id}`);
        // 請求書の状態更新
        // await updateInvoiceStatus(invoice.id, 'paid');
        console.log(`✅ Invoice ${invoice.id} payment processed successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing invoice payment ${invoice.id}:`, error);
    }
}
// サブスクリプション作成時の処理
async function handleSubscriptionCreated(subscription) {
    try {
        console.log(`Processing subscription creation: ${subscription.id}`);
        // サブスクリプション情報の保存
        // await saveSubscriptionToDatabase({
        //   subscriptionId: subscription.id,
        //   customerId: subscription.customer as string,
        //   status: subscription.status,
        //   currentPeriodStart: subscription.current_period_start,
        //   currentPeriodEnd: subscription.current_period_end
        // });
        console.log(`✅ Subscription ${subscription.id} created successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing subscription creation ${subscription.id}:`, error);
    }
}
// サブスクリプション更新時の処理
async function handleSubscriptionUpdated(subscription) {
    try {
        console.log(`Processing subscription update: ${subscription.id}`);
        // サブスクリプション情報の更新
        // await updateSubscriptionInDatabase({
        //   subscriptionId: subscription.id,
        //   status: subscription.status,
        //   currentPeriodStart: subscription.current_period_start,
        //   currentPeriodEnd: subscription.current_period_end
        // });
        console.log(`✅ Subscription ${subscription.id} updated successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing subscription update ${subscription.id}:`, error);
    }
}
// サブスクリプション削除時の処理
async function handleSubscriptionDeleted(subscription) {
    try {
        console.log(`Processing subscription deletion: ${subscription.id}`);
        // サブスクリプションの無効化
        // await deactivateSubscription(subscription.id);
        // キャンセル通知の送信
        // await sendSubscriptionCancelledNotification(subscription);
        console.log(`✅ Subscription ${subscription.id} deleted successfully`);
    }
    catch (error) {
        console.error(`❌ Error processing subscription deletion ${subscription.id}:`, error);
    }
}
export default router;
