import { Award, CheckCircle2, Printer, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type CompletionCertificateProps = {
  studentName: string;
  targetRole: string;
  targetCompany?: string | null;
  completedPaths: number;
  totalPaths: number;
  completedDays: number;
  totalDays: number;
  unlocked: boolean;
};

function certificateCode(studentName: string, targetRole: string) {
  const source = `${studentName}:${targetRole}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return `CP-${hash.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function CompletionCertificate({
  studentName,
  targetRole,
  targetCompany,
  completedPaths,
  totalPaths,
  completedDays,
  totalDays,
  unlocked,
}: CompletionCertificateProps) {
  const code = certificateCode(studentName, targetRole);

  return (
    <div className="card-surface overflow-hidden border-terracotta/30">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[14.5px] font-bold">CareerPilot Certificate</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              AI-generated proof of roadmap completion
            </p>
          </div>
        </div>
        {unlocked && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-[11px]"
            onClick={() => window.print()}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Save PDF
          </Button>
        )}
      </div>

      <div className="p-5">
        {unlocked ? (
          <div className="rounded-2xl border border-terracotta/35 bg-terracotta/[0.04] p-5 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-terracotta" />
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-terracotta">
              Verified learning achievement
            </p>
            <p className="mt-2 text-lg font-black text-foreground">{studentName}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              completed the CareerPilot path for <span className="font-semibold">{targetRole}</span>
              {targetCompany ? ` at ${targetCompany}` : ""}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-[11px]">
              <div className="rounded-lg bg-card p-2.5">
                <p className="text-muted-foreground">Learning paths</p>
                <p className="mt-0.5 font-bold">
                  {completedPaths}/{totalPaths}
                </p>
              </div>
              <div className="rounded-lg bg-card p-2.5">
                <p className="text-muted-foreground">Practice days</p>
                <p className="mt-0.5 font-bold">
                  {completedDays}/{totalDays}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[10px] font-semibold tracking-wider text-muted-foreground">
              Credential ID: {code}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Finish every learning path and its assessment gates to unlock a recruiter-ready
              completion certificate.
            </p>
            <div className="space-y-2 text-[11.5px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  {completedPaths}/{totalPaths || "?"} learning paths complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  {completedDays}/{totalDays || "?"} practice days complete
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
