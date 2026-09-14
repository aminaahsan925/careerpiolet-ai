import { describe, it, expect, vi } from "vitest";
import { buildCareerState, careerStateToPrompt } from "./career-state.server";

const createMockSupabase = (overrides: Record<string, any> = {}) => {
  const defaultData = {
    profiles: { data: null },
    careergoals: { data: null },
    targetjobs: { data: null },
    userskills: { data: [] },
    skillevidence: { data: [] },
    resumeanalyses: { data: null },
    skillgaps: { data: [] },
    roadmapstages: { data: [] },
    weeklygoals: { data: [] },
    applications: { data: [] },
    readinesssnapshots: { data: null },
    userprojects: { data: [] },
  };

  const merged = { ...defaultData, ...overrides };

  return {
    from: vi.fn((table: string) => {
      const key = table.replace(/_/g, "");
      const data = merged[key]?.data ?? (merged[key] === undefined ? defaultData[key]?.data : null);
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
        single: vi.fn().mockResolvedValue({ data, error: null }),
      };
    }),
  };
};

describe("buildCareerState", () => {
  it.skip("returns structured career state with all fields - integration test needs proper mock", async () => {
    // TODO: Fix mock to properly handle chained supabase calls
    const mockSupabase = createMockSupabase({
      profiles: { data: { first_name: "Test", last_name: "User", current_role: "Student", education_level: "Bachelor", degree: "CS", university: "Test Uni", graduation_year: 2024 } },
      careergoals: { data: { target_role: "Software Engineer", target_industry: "Tech" } },
      targetjobs: { data: { id: "job-1", title: "Software Engineer", company: "Acme", parsed: { required_skills: ["TypeScript", "React"] }, description: "desc" } },
      userskills: { data: [{ proficiency: 80, skills: { name: "TypeScript" } }, { proficiency: 70, skills: { name: "React" } }] },
      skillevidence: { data: [{ skill_name: "TypeScript", source: "project", strength: 2 }, { skill_name: "React", source: "resume", strength: 1 }] },
      resumeanalyses: { data: { ats_score: 85, resume_score: 80, career_match: 75, strengths: ["Strong projects"], weaknesses: ["No internship"], detected_skills: ["TypeScript", "React"] } },
      skillgaps: { data: [{ skill: "Node.js", status: "missing", priority: "high", evidence: "No backend exp", required_level: "proficient", why_it_matters: "Backend needed", action: "Learn Node", proof_task: "Build API" }] },
      roadmapstages: { data: [{ title: "Foundations", completed: true }, { title: "Backend", completed: false }] },
      weeklygoals: { data: [{ title: "Learn Node.js", completed: false }] },
      applications: { data: [{ company: "Acme", role_title: "Software Engineer", status: "Applied" }] },
      readinesssnapshots: { data: { overall: 65, breakdown: [], blockers: [], stage: "Closing gaps", next_action: "Learn Node.js", method_version: "v1" } },
      userprojects: { data: [{ name: "Portfolio", description: "Personal site", technologies: ["React", "TypeScript"], project_url: "https://github.com/test/portfolio", project_type: "personal", completed: true }] },
    });

    const state = await buildCareerState(mockSupabase as any, "test-user");

    expect(state.userId).toBe("test-user");
    expect(state.targetRole).toBe("Software Engineer");
    expect(state.skills.length).toBe(2);
    expect(state.gaps.length).toBe(1);
    expect(state.projects.length).toBe(1);
    expect(state.resume.hasResume).toBe(true);
    expect(state.readiness?.overall).toBe(65);
  });

  it("handles missing data gracefully", async () => {
    const mockSupabase = createMockSupabase({});

    const state = await buildCareerState(mockSupabase as any, "test-user");

    expect(state.userId).toBe("test-user");
    expect(state.targetRole).toBeNull();
    expect(state.skills).toEqual([]);
    expect(state.gaps).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.resume.hasResume).toBe(false);
    expect(state.readiness).toBeNull();
  });
});

describe("careerStateToPrompt", () => {
  it("generates prompt with all sections", () => {
    const state = {
      userId: "test",
      profile: { firstName: "Test", lastName: "User", currentRole: "Student", educationLevel: "Bachelor", degree: "CS", university: "Uni", graduationYear: 2024 },
      targetRole: "Software Engineer",
      targetIndustry: "Tech",
      targetJob: { id: "job-1", title: "Software Engineer", company: "Acme", parsed: { required_skills: ["TypeScript", "React"] } },
      skills: [{ name: "TypeScript", proficiency: 80, evidenceStrength: 2, sources: ["project"] }],
      evidenceCount: 1,
      projects: [{ name: "Portfolio", description: null, technologies: ["React"], projectUrl: "https://github.com/test/portfolio", projectType: "personal", completed: true }],
      resume: { hasResume: true, atsScore: 85, resumeScore: 80, careerMatch: 75, strengths: [], weaknesses: [], detectedSkills: [] },
      gaps: [{ skill: "Node.js", status: "missing", priority: "high", evidence: null, requiredLevel: "proficient", whyItMatters: "Backend", action: "Learn", proofTask: "Build API" }],
      roadmap: { total: 2, completed: 1, stages: [{ title: "Foundations", completed: true }, { title: "Backend", completed: false }] },
      weeklyGoals: [{ title: "Learn Node", completed: false }],
      applications: [{ company: "Acme", role: "Software Engineer", status: "Applied" }],
      readiness: { overall: 65, breakdown: [], blockers: [], stage: "Closing gaps", nextAction: "Learn Node" },
    };

    const prompt = careerStateToPrompt(state);
    expect(prompt).toContain("Test User");
    expect(prompt).toContain("Software Engineer");
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Node.js");
    expect(prompt).toContain("65/100");
  });
});