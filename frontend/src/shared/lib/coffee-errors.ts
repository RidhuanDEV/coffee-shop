import type { CoffeeKey } from "@/hooks/useCoffee";
export function coffeeErrorKey(error: Error): CoffeeKey {
  switch (error.message) {
    case "INVALID_CREDENTIALS":
      return "loginFailed";
    case "INVALID_TABLE":
    case "TABLE_REQUIRED":
      return "invalidTable";
    case "PRODUCT_UNAVAILABLE":
      return "unavailable";
    case "VALIDATION_FAILED":
    case "INVALID_RANGE":
      return "validation";
    case "IDEMPOTENCY_CONFLICT":
    case "CONFLICT":
      return "conflictError";
    case "INVALID_TRANSITION":
    case "ORDER_ALREADY_PAID":
      return "stateError";
    case "PERMISSION_DENIED":
      return "permissionError";
    case "INVALID_IMAGE":
    case "PAYLOAD_TOO_LARGE":
      return "imageError";
    default:
      return "error";
  }
}
