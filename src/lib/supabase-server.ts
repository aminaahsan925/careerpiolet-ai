// Server-only Supabase client with service role key for admin operations
// NEVER import this in browser code - it bypasses RLS
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function createServerSupabaseClient(): ReturnType<typeof createClient<Database>> {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error("Missing or invalid SUPABASE_URL environment variable");
  }
  if (!serviceKey || !serviceKey.startsWith("sb_secret_")) {
    throw new Error("Missing or invalid SUPABASE_SERVICE_ROLE_KEY environment variable (must be a service role key)");
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _serverSupabase: ReturnType<typeof createServerSupabaseClient> | undefined;

export function getServerSupabase(): ReturnType<typeof createClient<Database>> {
  if (!_serverSupabase) {
    _serverSupabase = createServerSupabaseClient();
  }
  return _serverSupabase;
}

// For server functions that need user-context (with RLS)
export function createUserSupabaseClient(userToken: string): ReturnType<typeof createClient<Database>> {
  const url = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !url.startsWith("https://") || !url.includes(".supabase.co")) {
    throw new Error("Missing or invalid SUPABASE_URL environment variable");
  }
  if (!publishableKey || !publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Missing or invalid SUPABASE_PUBLISHABLE_KEY environment variable");
  }

  return createClient<Database>(url, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}