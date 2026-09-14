import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export interface RateLimitConfig {
  dailyTokenLimit: number;
  dailyRequestLimit: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  dailyTokenLimit: 50_000,
  dailyRequestLimit: 100,
  windowMs: 24 * 60 * 60 * 1000,
};

export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  remainingRequests: number;
  resetAt: number;
  retryAfterMs?: number;
}

function getWindowStart(windowMs: number): number {
  const now = Date.now();
  return now - (now % windowMs);
}

export async function checkRateLimit(
  supabase: Client,
  userId: string,
  estimatedTokens: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): Promise<RateLimitResult> {
  const windowStart = getWindowStart(config.windowMs);
  const windowEnd = windowStart + config.windowMs;

  const { data: existing, error } = await supabase
    .from("ai_usage")
    .select("tokens_used, requests_made")
    .eq("user_id", userId)
    .eq("window_start", new Date(windowStart).toISOString())
    .maybeSingle();

  if (error) {
    console.error("[RateLimit] Failed to check usage", { userId, error });
    return {
      allowed: true,
      remainingTokens: config.dailyTokenLimit,
      remainingRequests: config.dailyRequestLimit,
      resetAt: windowEnd,
    };
  }

  const tokensUsed = existing?.tokens_used ?? 0;
  const requestsMade = existing?.requests_made ?? 0;

  const remainingTokens = Math.max(0, config.dailyTokenLimit - tokensUsed);
  const remainingRequests = Math.max(0, config.dailyRequestLimit - requestsMade);

  if (remainingTokens < estimatedTokens || remainingRequests <= 0) {
    return {
      allowed: false,
      remainingTokens,
      remainingRequests,
      resetAt: windowEnd,
      retryAfterMs: windowEnd - Date.now(),
    };
  }

  return {
    allowed: true,
    remainingTokens: remainingTokens - estimatedTokens,
    remainingRequests: remainingRequests - 1,
    resetAt: windowEnd,
  };
}

export async function recordUsage(
  supabase: Client,
  userId: string,
  tokensUsed: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): Promise<void> {
  const windowStart = getWindowStart(config.windowMs);

  const { error } = await supabase.from("ai_usage").upsert(
    {
      user_id: userId,
      window_start: new Date(windowStart).toISOString(),
      tokens_used: tokensUsed,
      requests_made: 1,
    },
    {
      onConflict: "user_id,window_start",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    console.error("[RateLimit] Failed to record usage", { userId, tokensUsed, error });
  }
}

export async function incrementUsage(
  supabase: Client,
  userId: string,
  tokensUsed: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): Promise<void> {
  const windowStart = getWindowStart(config.windowMs);

  const { error } = await supabase.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_window_start: new Date(windowStart).toISOString(),
    p_tokens: tokensUsed,
  });

  if (error) {
    console.error("[RateLimit] Failed to increment usage", { userId, tokensUsed, error });
  }
}

export function estimateTokens(messages: Array<{ role: string; content: string }>, maxTokens: number): number {
  const inputTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  return inputTokens + maxTokens;
}