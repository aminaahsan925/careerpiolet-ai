import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, CircleHelp, MessageSquareText, Sparkles } from "lucide-react";
import { useState } from "react";

import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { buildInterviewIntel, getInterviewCompanies, type InterviewQuestion } from "@/data/interview-intel";
import { useCurrentUser } from "@/data/user";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/jobmirror")({
  head: () => ({
    meta: [
      { title: "Interview Prep - CareerPilot AI" },
      { name: "description", content: "Prepare for the interview stages and questions behind your target role." },
    ],
  }),
  component: InterviewPrepPage,
});

function QuestionCard({ question }: { question: InterviewQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
        <CircleHelp className="h-4 w-4 shrink-0 text-terracotta" />
        <span className="flex-1 text-[13px] font-semibold text-foreground">{question.question}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3 text-[12px] leading-relaxed">
          <div><p className="font-bold text-foreground">What it tests</p><p className="mt-1 text-muted-foreground">{question.whatItTests}</p></div>
          <div><p className="font-bold text-foreground">Strong answer shape</p><p className="mt-1 text-muted-foreground">{question.strongAnswer}</p></div>
          <div className="rounded-xl bg-terracotta/5 p-3 text-muted-foreground"><span className="font-bold text-terracotta">Hiring signal: </span>{question.companySignal}</div>
        </div>
      )}
    </div>
  );
}

function InterviewPrepPage() {
  const { data: user } = useCurrentUser();
  const companies = getInterviewCompanies();
  const defaultCompany = user?.applications?.[0]?.company || companies[0]?.name || "Target company";
  const [company, setCompany] = useState(defaultCompany);
  const targetRole = user?.goal || user?.role || "Technology role";
  const intel = buildInterviewIntel(targetRole, company);

  return (
    <AppLayout title="Interview Prep" subtitle="Turn your target role into a focused interview practice plan">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="card-surface bg-ink p-6 text-white sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta/20 text-terracotta"><MessageSquareText className="h-5 w-5" /></div>
              <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">AI interview brief</p><h2 className="mt-2 text-2xl font-black">{intel.role}</h2><p className="mt-1 text-[13px] text-white/65">{intel.companyTagline}</p></div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/55" htmlFor="interview-company">Target company</label>
              <select id="interview-company" value={company} onChange={(event) => setCompany(event.target.value)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] text-white outline-none">
                {companies.map((item) => <option key={item.id} value={item.name} className="text-foreground">{item.name}</option>)}
                {!companies.some((item) => item.name === company) && <option value={company} className="text-foreground">{company}</option>}
              </select>
            </div>
          </div>

          <div className="card-surface p-5 sm:p-6">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-terracotta" /><h3 className="text-[14.5px] font-bold">What this employer will evaluate</h3></div>
            <div className="mt-4 flex flex-wrap gap-2">{intel.focusAreas.map((area) => <span key={area} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold">{area}</span>)}</div>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">{intel.note}</p>
          </div>

          <div className="card-surface p-5 sm:p-6">
            <h3 className="text-[14.5px] font-bold">Practice questions</h3>
            <div className="mt-4 space-y-2">{intel.questions.map((question) => <QuestionCard key={question.question} question={question} />)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-5">
            <h3 className="text-[14.5px] font-bold">Expected interview stages</h3>
            <div className="mt-4 space-y-3">{intel.stages.map((stage, index) => <div key={stage} className="flex items-start gap-3 text-[12px]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-[10px] font-bold text-terracotta">{index + 1}</span><span className="leading-relaxed text-muted-foreground">{stage}</span></div>)}</div>
          </div>
          <div className="card-surface bg-terracotta/5 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">Your next move</p>
            <p className="mt-2 text-[13px] font-semibold leading-relaxed">Answer one question aloud, attach evidence from your roadmap project, and ask your AI Mentor to challenge the gaps.</p>
            <Button className="mt-4 rounded-xl bg-ink text-xs font-bold text-white hover:bg-ink/90" onClick={() => window.location.assign("/mentor")}>Open AI Mentor</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
