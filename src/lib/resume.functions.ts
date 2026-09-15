import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { resumeId: string }) => {
    const resumeId = String(input?.resumeId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(resumeId)) throw new Error("Invalid resume reference.");
    return { resumeId };
  })
  .handler(async ({ data, context }) => {
    console.info("[CareerPilot][analyzeResume] start", { userId: context.userId });
    const { analyzeStoredResume } = await import("./resume.server");
    try {
      const result = await analyzeStoredResume(context.supabase, context.userId, data.resumeId);
      console.info("[CareerPilot][analyzeResume] success", {
        userId: context.userId,
        atsScore: result.ats_score,
      });
      return result;
    } catch (error) {
      console.error("[CareerPilot][analyzeResume] failed", {
        userId: context.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
