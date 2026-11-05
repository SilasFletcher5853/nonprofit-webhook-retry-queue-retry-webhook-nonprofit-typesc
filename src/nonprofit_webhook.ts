import { InfraiClient, verifyWebhookSignature } from "./infrai_client.ts";
import { decideDelivery } from "./retry_decision.ts";
import { z } from "zod";

type DonorReceipt = { donorId: string; receiptId: string; amountCents: number };
type VolunteerReminder = { volunteerId: string; shiftId: string; startsAt: string };
type CampaignReport = { campaignId: string; raisedCents: number; donorCount: number };
type NonprofitEvent =
  | { kind: "donor.receipt"; receipt: DonorReceipt }
  | { kind: "volunteer.reminder"; reminder: VolunteerReminder }
  | { kind: "campaign.report"; report: CampaignReport };

const nonprofitEventBody = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("donor.receipt"), receipt: z.object({ donorId: z.string().min(1), receiptId: z.string().min(1), amountCents: z.number().int().nonnegative() }) }),
  z.object({ kind: z.literal("volunteer.reminder"), reminder: z.object({ volunteerId: z.string().min(1), shiftId: z.string().min(1), startsAt: z.string().min(1) }) }),
  z.object({ kind: z.literal("campaign.report"), report: z.object({ campaignId: z.string().min(1), raisedCents: z.number().int().nonnegative(), donorCount: z.number().int().nonnegative() }) })
]);

export async function registerRetryQueue(client: InfraiClient, callbackUrl: string, secret: string): Promise<{ webhookId: string; queue: string }> {
  const queue = `nonprofit-webhook-${Date.now()}`;
  const deadLetterQueue = `${queue}-dead-letter`;
  await client.requestWithBackoff("/queue/create", "POST", { name: deadLetterQueue });
  await client.requestWithBackoff("/queue/create", "POST", { name: queue, dead_letter_queue: deadLetterQueue, max_retries: 5 });
  const registered = await client.requestWithBackoff<{ webhook_id: string }>("/account/webhooks/register", "POST", {
    url: callbackUrl,
    events: ["email.queued", "email.delivered", "queue.dlq"],
    description: "Nonprofit receipts, volunteer reminders, and campaign reports",
    secret
  });
  return { webhookId: registered.webhook_id, queue };
}

export async function publishBusinessEvent(client: InfraiClient, queue: string, event: NonprofitEvent): Promise<void> {
  const payload = nonprofitEventBody.parse(event);
  await client.requestWithBackoff("/queue/publish", "POST", { queue, payload });
}

export async function inspectDelivery(client: InfraiClient, webhookId: string): Promise<unknown> {
  return client.request(`/account/webhooks/deliveries/${webhookId}`, "GET");
}

export function acceptInboundWebhook(rawBody: string, signature: string, secret: string): boolean {
  return verifyWebhookSignature(rawBody, signature, secret);
}

export { decideDelivery };
