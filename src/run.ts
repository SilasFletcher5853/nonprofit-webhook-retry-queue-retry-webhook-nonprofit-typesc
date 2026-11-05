import { InfraiClient } from "./infrai_client.ts";
import { inspectDelivery, publishBusinessEvent, registerRetryQueue } from "./nonprofit_webhook.ts";

const key = process.env.INFRAI_API_KEY;
const callbackUrl = process.env.WEBHOOK_URL;
const secret = process.env.WEBHOOK_SECRET;
if (!key || !callbackUrl || !secret) throw new Error("Set INFRAI_API_KEY, WEBHOOK_URL, and WEBHOOK_SECRET");

const client = new InfraiClient(key);
const registration = await registerRetryQueue(client, callbackUrl, secret);
await publishBusinessEvent(client, registration.queue, {
  kind: "donor.receipt",
  receipt: { donorId: "donor-104", receiptId: "receipt-2026-001", amountCents: 2500 }
});
const deliveries = await inspectDelivery(client, registration.webhookId);
console.log(JSON.stringify({ queue: registration.queue, webhookId: registration.webhookId, deliveries }, null, 2));
