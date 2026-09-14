export enum AiErrorCode {
  NO_API_KEYS = "NO_API_KEYS",
  RATE_LIMITED = "RATE_LIMITED",
  INVALID_API_KEY = "INVALID_API_KEY",
  MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  JSON_PARSE_FAILED = "JSON_PARSE_FAILED",
  TOKEN_LIMIT_EXCEEDED = "TOKEN_LIMIT_EXCEEDED",
  CONTENT_FILTER = "CONTENT_FILTER",
  UNKNOWN = "UNKNOWN",
}

export class AiError extends Error {
  public readonly code: AiErrorCode;
  public readonly provider: string | null;
  public readonly model: string | null;
  public readonly retryable: boolean;
  public readonly correlationId: string;

  constructor(
    message: string,
    options: {
      code: AiErrorCode;
      provider?: string;
      model?: string;
      retryable?: boolean;
      cause?: Error;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AiError";
    this.code = options.code;
    this.provider = options.provider ?? null;
    this.model = options.model ?? null;
    this.retryable = options.retryable ?? false;
    this.correlationId = crypto.randomUUID();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      provider: this.provider,
      model: this.model,
      retryable: this.retryable,
      correlationId: this.correlationId,
      stack: this.stack,
    };
  }

  static fromFetchError(
    error: Error,
    provider: string,
    model: string,
  ): AiError {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return new AiError(`Request to ${provider}/${model} timed out`, {
        code: AiErrorCode.TIMEOUT,
        provider,
        model,
        retryable: true,
        cause: error,
      });
    }
    if (error.message.includes("fetch failed") || error.message.includes("network")) {
      return new AiError(`Network error calling ${provider}/${model}`, {
        code: AiErrorCode.NETWORK_ERROR,
        provider,
        model,
        retryable: true,
        cause: error,
      });
    }
    return new AiError(`Unknown error calling ${provider}/${model}: ${error.message}`, {
      code: AiErrorCode.UNKNOWN,
      provider,
      model,
      retryable: false,
      cause: error,
    });
  }

  static fromHttpError(
    status: number,
    provider: string,
    model: string,
    body: string,
  ): AiError {
    switch (status) {
      case 401:
      case 403:
        return new AiError(`Invalid API key for ${provider}`, {
          code: AiErrorCode.INVALID_API_KEY,
          provider,
          model,
          retryable: false,
        });
      case 429:
        return new AiError(`Rate limited by ${provider}`, {
          code: AiErrorCode.RATE_LIMITED,
          provider,
          model,
          retryable: true,
        });
      case 503:
        return new AiError(`Model ${model} unavailable on ${provider}`, {
          code: AiErrorCode.MODEL_UNAVAILABLE,
          provider,
          model,
          retryable: true,
        });
      default:
        return new AiError(`${provider}/${model} returned ${status}: ${body.slice(0, 200)}`, {
          code: AiErrorCode.UNKNOWN,
          provider,
          model,
          retryable: status >= 500,
        });
    }
  }

  static noKeysConfigured(): AiError {
    return new AiError("No AI provider API keys configured", {
      code: AiErrorCode.NO_API_KEYS,
      provider: null,
      model: null,
      retryable: false,
    });
  }

  static jsonParseFailed(raw: string, provider: string, model: string): AiError {
    return new AiError("Failed to parse AI response as JSON", {
      code: AiErrorCode.JSON_PARSE_FAILED,
      provider,
      model,
      retryable: false,
    });
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AiError) {
    return error.retryable;
  }
  return false;
}

export function getUserFacingMessage(error: unknown): string {
  if (error instanceof AiError) {
    switch (error.code) {
      case AiErrorCode.RATE_LIMITED:
        return "The AI service is temporarily busy. Please try again in a moment.";
      case AiErrorCode.INVALID_API_KEY:
        return "AI service configuration error. Please contact support.";
      case AiErrorCode.MODEL_UNAVAILABLE:
        return "The AI model is temporarily unavailable. Trying alternative...";
      case AiErrorCode.TIMEOUT:
        return "The AI request took too long. Please try again.";
      case AiErrorCode.NO_API_KEYS:
        return "AI service is not configured. Please contact support.";
      case AiErrorCode.CONTENT_FILTER:
        return "Your request was blocked by content filters. Please rephrase.";
      default:
        return "The AI service is currently unavailable. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}