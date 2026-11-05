import { strict as assert } from "node:assert";
import { decideDelivery } from "./retry_decision.ts";

assert.equal(decideDelivery(1, 503, 5), "retryable");
assert.equal(decideDelivery(5, 503, 5), "exhausted");
assert.equal(decideDelivery(5, 204, 5), "delivered");
console.log("retry policy keeps transient failures in the source queue and exhausts them at the configured limit");
