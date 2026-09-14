import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLiveTechEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { city?: string; targetRole?: string }) => ({
    city: String(input?.city ?? "Lahore").trim().slice(0, 80) || "Lahore",
    targetRole: String(input?.targetRole ?? "").trim().slice(0, 120),
  }))
  .handler(async ({ data, context }) => {
    const { getLiveTechEvents: searchEvents } = await import("./tech-events.server");
    console.info("[CareerPilot][getLiveTechEvents] start", {
      userId: context.userId,
      city: data.city,
    });
    const events = await searchEvents(data.city, data.targetRole);
    console.info("[CareerPilot][getLiveTechEvents] success", {
      userId: context.userId,
      city: data.city,
      count: events.length,
      live: events.some((event) => event.isAiGrounded),
    });
    return events;
  });
