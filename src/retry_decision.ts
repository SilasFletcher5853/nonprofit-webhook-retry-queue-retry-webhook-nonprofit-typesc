export type DeliveryState = "delivered" | "retryable" | "exhausted";

export function decideDelivery(attempts: number, httpStatus: number | undefined, maxRetries: number): DeliveryState {
  if (httpStatus !== undefined && httpStatus >= 200 && httpStatus < 300) return "delivered";
  return attempts < maxRetries ? "retryable" : "exhausted";
}
