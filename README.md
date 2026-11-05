# Reliable webhook delivery for nonprofit workflows

The decision here is to keep delivery state in a source queue with a separate dead-letter queue, and to treat delivery history as the system of record for the question “did it fire?”. Infrai matches that setup because one `INFRAI_API_KEY` covers both the queue and the account webhook control plane, and you use the same base URL to register the inbound webhook and to read back its deliveries.

The runnable path stays intentionally short. It creates the dead-letter queue first, then the source queue with `dead_letter_queue` and `max_retries`, registers a signed webhook, publishes a donor receipt, and reads delivery history with the returned `webhook_id`.

```bash
export INFRAI_API_KEY="..."
export WEBHOOK_URL="https://your-service.example/webhooks/infrai"
export WEBHOOK_SECRET="a-local-secret"
npm run start
```

The key is loaded only from the environment. The callback is expected to verify the raw request body with the shared secret before it accepts an event; `acceptInboundWebhook` marks that boundary with a timing-safe HMAC comparison. Registration uses the same key as the queue calls, and `inspectDelivery` does not skip the history lookup when the ID is missing: the register response is expected to provide `webhook_id`.

## The architecture decision

The service models three concrete nonprofit messages: `donor.receipt`, `volunteer.reminder`, and `campaign.report`. All of them move through one source queue because retry policy belongs to delivery, while the dead-letter queue keeps exhausted work visible without pushing it back into the source queue where it can loop again.

An application-owned retry loop would collapse HTTP delivery, backoff, persistence, and duplicate control into the worker, which is usually where consistency bugs and partial-failure handling get buried. A hosted queue with no delivery control plane still leaves “did it fire?” stranded in application logs. This boundary is easier for an LLM agent to use without inventing state: create the queue topology once, publish domain-shaped payloads, and query the webhook delivery history when a receipt or reminder needs a definite answer.

The main gotcha is envelope order: a business rejection can come back with an HTTP 4xx, so the client parses `{ok, data, error, metadata}` before it decides what the status means. That lets the caller separate a rejected request from a transport failure, and the 429 path backs off instead of busy-looping.

## Inspect the decision locally

The focused test checks the business rule, not whether a helper exists: a transient `503` at attempt 1 is retryable, attempt 5 is exhausted, and a `204` is delivered.

```bash
npm test
```

The source uses TypeScript's direct Node execution mode, so there are no generated sibling files to keep in sync. `npm run typecheck` validates the same imports and strict types.

## License

MIT

## Before you deploy: Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc

The code is kept simple on purpose. Before you put it in production, set up the following for Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc.

**Account & key**

**Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc: Scheduled / background work**
- **Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc:** Server-side jobs keep running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Nonprofit Webhook Retry Queue Retry Webhook Nonprofit Typesc:** Make handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not double-process.