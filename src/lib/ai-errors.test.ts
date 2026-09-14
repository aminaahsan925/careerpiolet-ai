import { describe, it, expect } from "vitest";
import { AiError, AiErrorCode, isRetryableError, getUserFacingMessage } from "./ai-errors";

describe("AiError", () => {
  it("creates error with all properties", () => {
    const error = new AiError("Test error", {
      code: AiErrorCode.RATE_LIMITED,
      provider: "Groq",
      model: "qwen/qwen3.8-27b",
      retryable: true,
    });

    expect(error.message).toBe("Test error");
    expect(error.code).toBe(AiErrorCode.RATE_LIMITED);
    expect(error.provider).toBe("Groq");
    expect(error.model).toBe("qwen/qwen3.8-27b");
    expect(error.retryable).toBe(true);
    expect(error.correlationId).toBeDefined();
    expect(error.name).toBe("AiError");
  });

  it("serializes to JSON correctly", () => {
    const error = new AiError("Test error", {
      code: AiErrorCode.INVALID_API_KEY,
      provider: "Gemini",
      model: "gemini-3-flash-preview",
      retryable: false,
    });

    const json = error.toJSON();
    expect(json.code).toBe(AiErrorCode.INVALID_API_KEY);
    expect(json.provider).toBe("Gemini");
    expect(json.model).toBe("gemini-3-flash-preview");
    expect(json.retryable).toBe(false);
    expect(json.correlationId).toBeDefined();
  });

  it("creates error from fetch timeout", () => {
    const cause = new Error("The operation was aborted");
    cause.name = "AbortError";
    const error = AiError.fromFetchError(cause, "Groq", "qwen/qwen3.8-27b");

    expect(error.code).toBe(AiErrorCode.TIMEOUT);
    expect(error.retryable).toBe(true);
    expect(error.provider).toBe("Groq");
    expect(error.model).toBe("qwen/qwen3.8-27b");
  });

  it("creates error from network failure", () => {
    const cause = new Error("fetch failed: network error");
    const error = AiError.fromFetchError(cause, "OpenRouter", "meta-llama/llama-3.3-70b-instruct");

    expect(error.code).toBe(AiErrorCode.NETWORK_ERROR);
    expect(error.retryable).toBe(true);
  });

  it("creates error from HTTP 401", () => {
    const error = AiError.fromHttpError(401, "Groq", "qwen/qwen3.8-27b", "Unauthorized");

    expect(error.code).toBe(AiErrorCode.INVALID_API_KEY);
    expect(error.retryable).toBe(false);
  });

  it("creates error from HTTP 429", () => {
    const error = AiError.fromHttpError(429, "Groq", "qwen/qwen3.8-27b", "Rate limited");

    expect(error.code).toBe(AiErrorCode.RATE_LIMITED);
    expect(error.retryable).toBe(true);
  });

  it("creates error from HTTP 503", () => {
    const error = AiError.fromHttpError(503, "Gemini", "gemini-3-flash-preview", "Model overloaded");

    expect(error.code).toBe(AiErrorCode.MODEL_UNAVAILABLE);
    expect(error.retryable).toBe(true);
  });

  it("creates no-keys error", () => {
    const error = AiError.noKeysConfigured();

    expect(error.code).toBe(AiErrorCode.NO_API_KEYS);
    expect(error.retryable).toBe(false);
    expect(error.provider).toBeNull();
    expect(error.model).toBeNull();
  });

  it("creates JSON parse error", () => {
    const error = AiError.jsonParseFailed("not json", "OpenRouter", "meta-llama/llama-3.3-70b-instruct");

    expect(error.code).toBe(AiErrorCode.JSON_PARSE_FAILED);
    expect(error.retryable).toBe(false);
  });
});

describe("isRetryableError", () => {
  it("returns true for retryable AiError", () => {
    const error = new AiError("Test", { code: AiErrorCode.RATE_LIMITED, retryable: true });
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns false for non-retryable AiError", () => {
    const error = new AiError("Test", { code: AiErrorCode.INVALID_API_KEY, retryable: false });
    expect(isRetryableError(error)).toBe(false);
  });

  it("returns false for non-AiError", () => {
    expect(isRetryableError(new Error("regular error"))).toBe(false);
    expect(isRetryableError("string")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe("getUserFacingMessage", () => {
  it("returns user-friendly message for rate limited", () => {
    const error = new AiError("Rate limited", { code: AiErrorCode.RATE_LIMITED });
    expect(getUserFacingMessage(error)).toContain("busy");
  });

  it("returns user-friendly message for invalid key", () => {
    const error = new AiError("Invalid key", { code: AiErrorCode.INVALID_API_KEY });
    expect(getUserFacingMessage(error)).toContain("configuration error");
  });

  it("returns user-friendly message for model unavailable", () => {
    const error = new AiError("Model unavailable", { code: AiErrorCode.MODEL_UNAVAILABLE });
    expect(getUserFacingMessage(error)).toContain("alternative");
  });

  it("returns user-friendly message for timeout", () => {
    const error = new AiError("Timeout", { code: AiErrorCode.TIMEOUT });
    expect(getUserFacingMessage(error)).toContain("too long");
  });

  it("returns user-friendly message for no keys", () => {
    const error = new AiError("No keys", { code: AiErrorCode.NO_API_KEYS });
    expect(getUserFacingMessage(error)).toContain("not configured");
  });

  it("returns user-friendly message for content filter", () => {
    const error = new AiError("Content filter", { code: AiErrorCode.CONTENT_FILTER });
    expect(getUserFacingMessage(error)).toContain("blocked");
  });

  it("returns generic message for unknown error", () => {
    const error = new AiError("Unknown", { code: AiErrorCode.UNKNOWN });
    expect(getUserFacingMessage(error)).toContain("unavailable");
  });

  it("returns generic message for non-AiError", () => {
    expect(getUserFacingMessage(new Error("regular"))).toContain("unexpected");
    expect(getUserFacingMessage("string")).toContain("unexpected");
  });
});