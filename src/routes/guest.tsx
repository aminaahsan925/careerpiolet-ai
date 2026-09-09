import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  LockKeyhole,
  Map,
  Plane,
  Stethoscope,
  Target,
  UserCheck,
} from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";

const screens = [
  { id: "dashboard", label: "Dashboard", icon: Target },
  { id: "diagnosis", label: "Career Diagnosis", icon: Stethoscope },
  { id: "recruiter", label: "Recruiter Audit", icon: UserCheck },
  { id: "market", label: "Market Reality", icon: BarChart3 },
  { id: "gaps", label: "Skill Gaps", icon: CheckCircle2 },
  { id: "flightplan", label: "Flight Plan", icon: Plane },
  { id: "mentor", label: "AI Mentor", icon: Bot },
] as const;

type Screen = (typeof screens)[number]["id"];

export const Route = createFileRoute("/guest")({
  validateSearch: (search): { screen: Screen } => {
    const screen = search["screen"];
    return {
      screen: typeof screen === "string" && screens.some((item) => item.id === screen)
        ? (screen as Screen)
        : "dashboard",
    };
  },
  head: () => ({ meta: [{ title: "Guest Demo — CareerPilot AI" }] }),
  component: GuestDemo,
});

const demo = {
  name: "Sara Ahmed",
  role: "Recent CS Graduate",
  target: "Full-Stack Developer",
  score: 62,
  skills: ["JavaScript", "React", "Node.js", "SQL"],
};

function GuestDemo() {
  const { screen } = Route.useSearch();
  const current = screens.find((item) => item.id === screen) ?? screens[0];
  const Icon = current.icon;

  return (
    <AppLayout title={current.label} subtitle="Safe, read-only product preview">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta/25 bg-terracotta/5 px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <LockKeyhole className="h-4 w-4 text-terracotta" />
          <span>Guest Demo</span>
          <span className="text-muted-foreground">• Demo Candidate: Sara Ahmed</span>
        </div>
        <Link to="/auth" search={{ redirect: undefined, reset: undefined }} className="text-[12px] font-semibold text-terracotta hover:underline">
          Sign in with your profile
        </Link>
      </div>

      <nav aria-label="Guest demo screens" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {screens.map(({ id, label, icon: ScreenIcon }) => (
          <Link
            key={id}
            to="/guest"
            search={{ screen: id }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${screen === id ? "border-terracotta bg-terracotta text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            <ScreenIcon className="h-3.5 w-3.5" /> {label}
          </Link>
        ))}
      </nav>

      <section className="card-surface overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta"><Icon className="h-5 w-5" /></div>
            <h2 className="mt-3 text-xl font-bold">{current.label}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{demo.name} · {demo.role} · Target: {demo.target}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">Read-only demo data</span>
        </div>
        <div className="p-5 sm:p-7"><ScreenContent screen={screen} /></div>
      </section>
    </AppLayout>
  );
}

function ScreenContent({ screen }: { screen: Screen }) {
  if (screen === "dashboard") return <Dashboard />;
  if (screen === "diagnosis") return <Diagnosis />;
  if (screen === "recruiter") return <Recruiter />;
  if (screen === "market") return <Market />;
  if (screen === "gaps") return <Gaps />;
  if (screen === "flightplan") return <FlightPlan />;
  return <Mentor />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>;
}

function Dashboard() {
  return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-3"><Stat label="Career readiness" value={`${demo.score}%`} /><Stat label="Target role" value="Full-Stack Developer" /><Stat label="Priority" value="Build API proof" /></div><div className="rounded-xl bg-secondary p-5"><p className="text-[13px] font-bold">Next best action</p><p className="mt-1 text-[13px] text-muted-foreground">Ship a deployed full-stack project with authentication, tests, and a clear README.</p></div></div>;
}

function Diagnosis() {
  return <div className="grid gap-4 md:grid-cols-3"><Stat label="Current stage" value="Building proof" /><Stat label="Strongest signal" value="React foundations" /><Stat label="Main blocker" value="Limited production evidence" /></div>;
}

function Recruiter() {
  return <div className="space-y-4"><Stat label="Demo audit score" value="62 / 100" /><div className="rounded-xl border border-border p-5 text-[13px] text-muted-foreground"><p className="font-bold text-foreground">Recruiter perspective</p><p className="mt-2">Sara has relevant foundations. A hiring team would look for a deployed project, measurable contribution, and stronger backend evidence before moving forward.</p></div></div>;
}

function Market() {
  return <div className="grid gap-4 md:grid-cols-3"><Stat label="Role demand" value="Competitive" /><Stat label="Core stack" value="React · Node · SQL" /><Stat label="Market focus" value="Deployment & APIs" /></div>;
}

function Gaps() {
  return <div className="space-y-3">{["REST API design and authentication", "Testing and deployment workflow", "Portfolio project impact statements"].map((gap) => <div key={gap} className="flex items-center gap-3 rounded-xl border border-border p-4"><Map className="h-4 w-4 text-terracotta" /><span className="text-[13px] font-medium">{gap}</span></div>)}</div>;
}

function FlightPlan() {
  return <div className="space-y-3">{["Define a full-stack project scope", "Build the API and database layer", "Deploy, test, and document the project"].map((step, index) => <div key={step} className="flex gap-4 rounded-xl border border-border p-4"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-[12px] font-bold text-terracotta">{index + 1}</span><p className="text-[13px] font-medium">{step}</p></div>)}</div>;
}

function Mentor() {
  return <div className="space-y-4"><div className="max-w-2xl rounded-2xl bg-secondary p-5 text-[13px] leading-relaxed text-foreground">For a Full-Stack Developer target, turn your React knowledge into credible proof: build one focused product, own its API and data model, deploy it, then explain the trade-offs clearly.</div><p className="text-[12px] text-muted-foreground">Sign in to use this feature with your own profile.</p></div>;
}
