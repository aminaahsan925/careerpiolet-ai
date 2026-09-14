import { describe, it, expect, vi } from "vitest";
import { computeReadiness } from "./readiness.server";
import type { CareerState } from "./career-state.server";

const baseState: CareerState = {
  userId: "test-user",
  profile: { firstName: "Test", lastName: "User", currentRole: null, educationLevel: null, degree: null, university: null, graduationYear: null },
  targetRole: "Software Engineer",
  targetIndustry: null,
  targetJob: {
    id: "job-1",
    title: "Software Engineer",
    company: "Acme Corp",
    parsed: { required_skills: ["TypeScript", "React", "Node.js", "PostgreSQL"] },
  },
  skills: [
    { name: "TypeScript", proficiency: 80, evidenceStrength: 2, sources: ["project"] },
    { name: "React", proficiency: 70, evidenceStrength: 1, sources: ["resume"] },
    { name: "Node.js", proficiency: 60, evidenceStrength: 0, sources: ["claim"] },
    { name: "Python", proficiency: 50, evidenceStrength: 0, sources: ["claim"] },
  ],
  evidenceCount: 2,
  projects: [{ name: "Portfolio", description: null, technologies: ["TypeScript", "React"], projectUrl: "https://github.com/test/portfolio", projectType: "personal", completed: true }],
  resume: { hasResume: true, atsScore: 85, resumeScore: 80, careerMatch: 75, strengths: [], weaknesses: [], detectedSkills: [] },
  gaps: [
    { skill: "TypeScript", status: "matched", priority: "high", evidence: "Project portfolio", requiredLevel: "proficient", whyItMatters: "Core requirement", action: "Maintain", proofTask: null },
    { skill: "React", status: "partial", priority: "high", evidence: "Resume mention", requiredLevel: "proficient", whyItMatters: "Core requirement", action: "Build more projects", proofTask: "Build a React app" },
    { skill: "Node.js", status: "no_evidence", priority: "high", evidence: "Claimed only", requiredLevel: "proficient", whyItMatters: "Backend required", action: "Build API", proofTask: "Build a REST API" },
    { skill: "PostgreSQL", status: "missing", priority: "high", evidence: "No evidence", requiredLevel: "familiar", whyItMatters: "Database required", action: "Learn PostgreSQL", proofTask: "Build a project with PostgreSQL" },
  ],
  roadmap: { total: 4, completed: 2, stages: [{ title: "Foundations", completed: true }, { title: "Backend", completed: true }, { title: "Frontend", completed: false }, { title: "Deployment", completed: false }] },
  weeklyGoals: [{ title: "Learn PostgreSQL", completed: false }, { title: "Build API", completed: false }],
  applications: [{ company: "Acme Corp", role: "Software Engineer", status: "Applied" }],
  readiness: null,
};

describe("computeReadiness", () => {
  it("computes overall score with all categories weighted correctly", () => {
    const result = computeReadiness(baseState);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it("returns correct breakdown categories", () => {
    const result = computeReadiness(baseState);
    const labels = result.breakdown.map((b) => b.label);
    expect(labels).toEqual(["Technical Skills", "Project Evidence", "Resume", "Portfolio Evidence", "Interview Readiness"]);
  });

  it("identifies blockers for high-priority unmatched gaps", () => {
    const result = computeReadiness(baseState);
    expect(result.blockers.length).toBeGreaterThan(0);
    const nodeBlocker = result.blockers.find((b) => b.problem.includes("Node.js"));
    expect(nodeBlocker).toBeDefined();
  });

  it("handles missing resume correctly", () => {
    const stateNoResume = { ...baseState, resume: { ...baseState.resume, hasResume: false } };
    const result = computeReadiness(stateNoResume);
    const resumeBlocker = result.blockers.find((b) => b.problem === "No resume uploaded");
    expect(resumeBlocker).toBeDefined();
  });

  it("handles no skills recorded", () => {
    const stateNoSkills = { ...baseState, skills: [], gaps: [], projects: [] };
    const result = computeReadiness(stateNoSkills);
    expect(result.overall).toBeLessThan(50);
    expect(result.breakdown.find((b) => b.label === "Technical Skills")?.score).toBe(0);
  });
});