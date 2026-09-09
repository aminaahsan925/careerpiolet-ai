import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  // Sessions live in localStorage, which the server cannot read.
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw redirect({ to: "/auth", search: { redirect: location.pathname, reset: undefined } });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed, current_status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      let onboarded = profile?.onboarding_completed === true;
      let phase1Done = profile?.current_status != null;

      // If the main query failed (pending Phase 1 migration or a transient
      // Supabase error), retry with the guaranteed-present column only so a
      // read failure never traps a signed-in user in an onboarding loop.
      if (profileError) {
        console.warn("[CareerPilot] Profile guard query failed, retrying basic fields:", profileError);
        const { data: basic, error: basicError } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (basicError) {
          // Both reads failed — fail open to the app. Pages render their own
          // error states with retry actions, which is better than a loop.
          console.warn("[CareerPilot] Basic profile query also failed, allowing through:", basicError);
          return { user: data.user };
        }
        onboarded = basic?.onboarding_completed === true;
        // current_status is unknown here; assume done rather than block.
        phase1Done = true;
      }
      const onOnboarding = location.pathname.startsWith("/onboarding");

      // Need onboarding if: never completed original onboarding, OR
      // legacy user who hasn't completed Phase 1 "Know Me" yet.
      if ((!onboarded || !phase1Done) && !onOnboarding) {
        throw redirect({ to: "/onboarding" });
      }
      // Returning users (onboarded + phase1Done) may freely access
      // /onboarding to edit their "Know Me" profile — no redirect.

      return { user: data.user };
    } catch (err) {
      // TanStack Router redirects have a `to` property — let them propagate.
      if (isRedirect(err)) throw err;
      // Any other error (missing env vars, Supabase init failure, network)
      // should gracefully redirect to the auth page instead of showing a 500.
      console.error("[CareerPilot] Auth check failed, redirecting to /auth:", err);
      throw redirect({ to: "/auth", search: { redirect: location.pathname, reset: undefined } });
    }
  },
  component: () => <Outlet />,
  pendingComponent: AuthPending,
});

function AuthPending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        Checking your session…
      </div>
    </div>
  );
}
