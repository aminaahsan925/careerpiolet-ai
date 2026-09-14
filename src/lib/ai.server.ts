/**
 * Server-only AI chat client with multi-provider support.
 *
 * Supports three backends, all speaking the OpenAI chat-completions dialect:
 *  - **Groq** (default) — fastest inference, generous free tier.
 *    Key: `GROQ_API_KEY` (get one at https://console.groq.com/keys)
 *  - **Gemini** — Google AI Studio, permanently free tier (~1M tokens/day),
 *    best long-context headroom for whole resumes and job descriptions.
 *    Key: `GEMINI_API_KEY` or `GOOGLE_API_KEY`
 *    (get one at https://aistudio.google.com/apikey)
 *  - **OpenRouter** — widest model selection, free-tier models available.
 *    Key: `OPENROUTER_API_KEY` (get one at https://openrouter.ai/keys)
 *
 * Set `AI_PROVIDER=groq | gemini | openrouter` in .env / secrets to choose the
 * first provider tried.  If it has no key configured — or every one of its
 * models fails — the client automatically walks the remaining providers that
 * *do* have a key, so a single exhausted free tier never takes the app down.
 *
 * Keys are read inside the call, never at module scope, and are never
 * exposed to the browser.
 */

export { AiError, AiErrorCode, isRetryableError, getUserFacingMessage } from "./ai-errors";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type AiProvider = "openrouter" | "groq" | "gemini";

type ProviderConfig = {
  url: string;
  models: string[];
  /** Accepted env var names, tried in order — first non-empty one wins. */
  envKeys: string[];
  extraHeaders: Record<string, string>;
  label: string;
};

const PROVIDERS: Record<AiProvider, ProviderConfig> = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      process.env["GROQ_MODEL"] || "qwen/qwen3.8-27b",
      "qwen/qwen3.6-27b",
      "openai/gpt-oss-20b",
    ].filter(Boolean),
    envKeys: ["GROQ_API_KEY"],
    extraHeaders: {},
    label: "Groq",
  },
  gemini: {
    // Google's OpenAI-compatible endpoint, so the same fetch body works.
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: [
      process.env["GEMINI_MODEL"] || "gemini-3-flash-preview",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
    ].filter(Boolean),
    envKeys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    extraHeaders: {},
    label: "Gemini",
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      process.env["OPENROUTER_MODEL"] || "openai/gpt-oss-20b",
      "meta-llama/llama-3.3-70b-instruct",
      "mistralai/mistral-7b-instruct:free",
      "deepseek/deepseek-chat",
    ].filter(Boolean),
    envKeys: ["OPENROUTER_API_KEY"],
    extraHeaders: {
      "HTTP-Referer": "https://careerpilot.dev",
      "X-Title": "CareerPilot AI",
    },
    label: "OpenRouter",
  },
};

function resolveApiKey(config: ProviderConfig): string | undefined {
  for (const name of config.envKeys) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

import { AiError, AiErrorCode } from "./ai-errors";
import { checkRateLimit, recordUsage, estimateTokens } from "./rate-limiter";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export interface GroqChatOptions {
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  totalTimeoutMs?: number;
  userId?: string;
  supabase?: Client;
}

async function groqChatInternal(
  messages: ChatMsg[],
  opts: GroqChatOptions = {},
): Promise<string> {
  const requested = (process.env["AI_PROVIDER"] ?? "groq").toLowerCase() as AiProvider;
  const allProviders: AiProvider[] = ["groq", "gemini", "openrouter"];
  const providerOrder = allProviders.includes(requested)
    ? [requested, ...allProviders.filter((p) => p !== requested)]
    : allProviders;

  const structuredErrors: Array<{ code: AiErrorCode; provider: string; model: string; message: string }> = [];
  let hasValidKey = false;
  const perModelTimeout = opts.timeoutMs ?? 45_000;
  const overallDeadline = Date.now() + (opts.totalTimeoutMs ?? 52_000);
  let budgetExhausted = false;

  for (const providerName of providerOrder) {
    if (budgetExhausted) break;
    const config = PROVIDERS[providerName];
    const apiKey = resolveApiKey(config);
    if (!apiKey) continue;

    hasValidKey = true;

    for (const model of config.models) {
      const remaining = overallDeadline - Date.now();
      if (remaining <= 2_000) {
        budgetExhausted = true;
        structuredErrors.push({
          code: AiErrorCode.TIMEOUT,
          provider: config.label,
          model,
          message: "overall time budget exhausted before more retries",
        });
        break;
      }
      const modelTimeout = Math.min(perModelTimeout, remaining);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), modelTimeout);

        const res = await fetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...config.extraHeaders,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.4,
            max_tokens: opts.maxTokens ?? 2400,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
            usage?: { total_tokens?: number };
          };
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            if (opts.userId && opts.supabase) {
              const tokensUsed = data.usage?.total_tokens ?? estimateTokens(messages, opts.maxTokens ?? 2400);
              await recordUsage(opts.supabase, opts.userId, tokensUsed);
            }
            return content;
          }
          structuredErrors.push({
            code: AiErrorCode.INVALID_RESPONSE,
            provider: config.label,
            model,
            message: "Empty response from model",
          });
        } else {
          const errText = await res.text().catch(() => "");
          const error = AiError.fromHttpError(res.status, config.label, model, errText);
          console.warn(
            `[AI][${config.label}] Model ${model} failed (${res.status}): ${errText.slice(0, 180)}`,
            { correlationId: error.correlationId, code: error.code },
          );
          structuredErrors.push({
            code: error.code,
            provider: config.label,
            model,
            message: error.message,
          });
        }
      } catch (err) {
        const error = AiError.fromFetchError(err instanceof Error ? err : new Error(String(err)), config.label, model);
        console.warn(`[AI][${config.label}] Model ${model} network error: ${error.message}`, {
          correlationId: error.correlationId,
          code: error.code,
        });
        structuredErrors.push({
          code: error.code,
          provider: config.label,
          model,
          message: error.message,
        });
      }
    }
  }

  if (!hasValidKey) {
    throw AiError.noKeysConfigured();
  }

  const lastError = structuredErrors[structuredErrors.length - 1];
  const summary = structuredErrors.map((e) => `${e.provider}(${e.model}): ${e.code}`).join("; ");
  throw new AiError(
    `The AI service is currently unavailable. (${summary}${budgetExhausted ? " — timed out" : ""})`,
    {
      code: lastError?.code ?? AiErrorCode.UNKNOWN,
      provider: lastError?.provider ?? null,
      model: lastError?.model ?? null,
      retryable: lastError?.code === AiErrorCode.TIMEOUT ||
        lastError?.code === AiErrorCode.RATE_LIMITED ||
        lastError?.code === AiErrorCode.MODEL_UNAVAILABLE ||
        lastError?.code === AiErrorCode.NETWORK_ERROR,
    },
  );
}

export async function groqChat(
  messages: ChatMsg[],
  opts: GroqChatOptions = {},
): Promise<string> {
  if (opts.userId && opts.supabase) {
    const estimatedTokens = estimateTokens(messages, opts.maxTokens ?? 2400);
    const rateLimit = await checkRateLimit(opts.supabase, opts.userId, estimatedTokens);
    if (!rateLimit.allowed) {
      throw new AiError("Daily AI usage limit exceeded. Please try again tomorrow.", {
        code: AiErrorCode.RATE_LIMITED,
        provider: null,
        model: null,
        retryable: false,
      });
    }
  }
  return groqChatInternal(messages, opts);
}

/** Parses a JSON object out of a model response, tolerating stray prose/fences. */
export function parseJsonObject<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new AiError("The AI response couldn't be read. Please try again.", {
      code: AiErrorCode.JSON_PARSE_FAILED,
      provider: null,
      model: null,
      retryable: false,
    });
  }
}

export function clampScore(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function stringList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
}
