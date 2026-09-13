export const APP_CONFIG_ERROR =
  "This app is not fully configured. Please try again later.";

export const BILLING_UNAVAILABLE_ERROR =
  "Billing is temporarily unavailable. Please try again later.";

const SENSITIVE_ERROR =
  /minified react error|#441|server components render|permission denied|row-level security|violates (check|foreign key|unique|not-null)|duplicate key|relation .+ does not exist|column .+ does not exist|\bP0001\b|\b42501\b|\b23503\b|\b23505\b|\b23514\b|\b42P01\b|jwt|api[_ ]?key|service[_ ]?role|sk_(live|test)_|rk_(live|test)_|whsec_|eyJ[A-Za-z0-9_-]{20,}|no such (customer|price|subscription|product)|invalid api key|stripe\.com|at Object\.|stack trace/i;

function redactSecrets(value: string) {
  return value
    .replace(/sk_(live|test)_[A-Za-z0-9]+/g, "sk_***")
    .replace(/rk_(live|test)_[A-Za-z0-9]+/g, "rk_***")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_***")
    .replace(
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      "[redacted]"
    );
}

export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message) {
    return error.message.trim();
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return "";
}

export function logServerError(scope: string, error: unknown) {
  const message = redactSecrets(extractErrorMessage(error) || "unknown error");
  console.error(`[${scope}] ${message}`);
}

export function toUserFacingError(error: unknown, fallback: string): string {
  const message = extractErrorMessage(error);

  if (!message) {
    return fallback;
  }

  if (SENSITIVE_ERROR.test(message) || message.includes("\n") || message.length > 160) {
    return fallback;
  }

  return message;
}
