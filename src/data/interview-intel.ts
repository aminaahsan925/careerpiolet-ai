import { FEATURED_COMPANIES, matchCompanyTruth } from "./company-truth";
import { resolveRoleProfile, type RoleTruthProfile } from "./market-truth";

export type InterviewQuestion = {
  question: string;
  category: "technical" | "system_design" | "behavioral";
  whatItTests: string;
  strongAnswer: string;
  companySignal: string;
};

export type InterviewIntel = {
  role: string;
  company: string;
  companyTagline: string;
  stages: string[];
  focusAreas: string[];
  questions: InterviewQuestion[];
  note: string;
};

const ROLE_QUESTIONS: Record<string, InterviewQuestion[]> = {
  "frontend-react": [
    {
      question: "A React page re-renders on every keystroke and feels slow. How do you investigate and fix it?",
      category: "technical",
      whatItTests: "React rendering, profiling, state placement, and performance judgement.",
      strongAnswer: "Start with the React Profiler, isolate the state owner, remove unnecessary renders, and only then use memoisation where measurement justifies it.",
      companySignal: "Frontend screens increasingly test internals, not just component syntax.",
    },
    {
      question: "How would you build a resilient data-fetching component for loading, empty, error, and retry states?",
      category: "technical",
      whatItTests: "Production UI thinking, accessibility, API boundaries, and failure handling.",
      strongAnswer: "Describe explicit state transitions, cancellation or stale-request protection, keyboard-friendly feedback, and a retry path that does not duplicate mutations.",
      companySignal: "Teams filter out portfolio UIs that only demonstrate the happy path.",
    },
    {
      question: "When would you choose server rendering, client rendering, or a server component for a feature?",
      category: "system_design",
      whatItTests: "Client-server boundaries, performance, security, and modern React architecture.",
      strongAnswer: "Tie the choice to data sensitivity, interactivity, cacheability, SEO, latency, and bundle size rather than treating one rendering mode as universally correct.",
      companySignal: "Modern frontend interviews probe architecture and trade-offs.",
    },
    {
      question: "Tell me about a production bug you found, the evidence you used, and the smallest safe fix.",
      category: "behavioral",
      whatItTests: "Debugging discipline, ownership, communication, and measurable impact.",
      strongAnswer: "Use a concise situation-evidence-action-result story with a link, metric, test, or before/after observation.",
      companySignal: "A deployed project with a visible commit trail is stronger than a list of frontend skills.",
    },
  ],
  "backend-node-python": [
    {
      question: "An endpoint is fast with 100 rows but slow with 1 million. How do you diagnose and fix it?",
      category: "technical",
      whatItTests: "Query plans, indexes, pagination, caching, and measurement.",
      strongAnswer: "Measure first, inspect EXPLAIN, add the right composite or covering index, paginate intentionally, and verify the change under realistic data.",
      companySignal: "Backend hiring bars expect database reasoning, not only framework familiarity.",
    },
    {
      question: "Design an idempotent payment or order-creation API that can safely be retried.",
      category: "system_design",
      whatItTests: "Transactions, idempotency keys, consistency, and failure recovery.",
      strongAnswer: "Cover an idempotency key, unique constraint, transaction boundary, durable status transitions, and what happens when the downstream provider times out.",
      companySignal: "Fintech and enterprise teams use business-logic scenarios to separate syntax from engineering judgement.",
    },
    {
      question: "What belongs in a unit test, integration test, and contract test for a REST service?",
      category: "technical",
      whatItTests: "Testing strategy, maintainability, and API reliability.",
      strongAnswer: "Explain the confidence/speed trade-off and show that the database and external boundaries are tested without making every test an end-to-end test.",
      companySignal: "A public repository with tests is evidence; a testing keyword is only a claim.",
    },
    {
      question: "Describe a time you changed an API or schema without breaking an existing consumer.",
      category: "behavioral",
      whatItTests: "Ownership, backwards compatibility, migration planning, and communication.",
      strongAnswer: "Show the rollout sequence, compatibility window, monitoring, and how you knew it was safe to remove the old path.",
      companySignal: "Interviewers look for production habits even in junior candidates.",
    },
  ],
  "full-stack": [
    {
      question: "Walk through a feature from browser click to database write, including authentication and failure states.",
      category: "system_design",
      whatItTests: "End-to-end ownership, API design, auth, persistence, and debugging.",
      strongAnswer: "Trace the request, authorization check, validation, transaction, response, UI state, and observability. Call out what can fail at each boundary.",
      companySignal: "Full-stack roles reward candidates who can explain the whole system, not only the screen.",
    },
    {
      question: "How would you model roles and permissions for a multi-tenant application?",
      category: "system_design",
      whatItTests: "Data modelling, tenant isolation, authorization, and secure defaults.",
      strongAnswer: "Use tenant-scoped records, server-side authorization on every access path, least privilege, and tests for cross-tenant leakage.",
      companySignal: "Enterprise employers often treat auth and data isolation as non-negotiable.",
    },
    {
      question: "What would you log and measure after deploying a new feature?",
      category: "technical",
      whatItTests: "Operational maturity, observability, performance, and product thinking.",
      strongAnswer: "Name useful events, errors, latency, adoption, and a rollback signal while avoiding sensitive data in logs.",
      companySignal: "Deployment proof matters when it includes how the candidate operated the system.",
    },
    {
      question: "What trade-off did you make in a project, and what would you change with twice the time?",
      category: "behavioral",
      whatItTests: "Self-awareness, prioritisation, and technical communication.",
      strongAnswer: "State the constraint, the decision, the consequence, and a specific next improvement instead of pretending the project was perfect.",
      companySignal: "This is a high-signal portfolio walkthrough question.",
    },
  ],
  "data-analyst-scientist": [
    {
      question: "A dashboard metric drops 20% overnight. What do you check before presenting the result?",
      category: "technical",
      whatItTests: "Data quality, query validation, statistical judgement, and stakeholder communication.",
      strongAnswer: "Check pipeline freshness, definitions, joins, filters, sampling, instrumentation, and segment the change before claiming a business explanation.",
      companySignal: "Analyst interviews test whether you can distinguish a signal from a broken dashboard.",
    },
    {
      question: "How would you choose between an inner join and a left join for a customer analysis?",
      category: "technical",
      whatItTests: "SQL correctness and awareness of silent data loss.",
      strongAnswer: "Explain the business question, the grain of each table, unmatched records, and how you would validate row counts after the join.",
      companySignal: "SQL beyond SELECT * is a common entry filter.",
    },
    {
      question: "How do you explain an analysis to a non-technical stakeholder who only wants the decision?",
      category: "behavioral",
      whatItTests: "Clarity, business framing, uncertainty, and recommendation quality.",
      strongAnswer: "Lead with the decision, show the evidence and uncertainty, name the limitation, and propose the next measurable action.",
      companySignal: "Communication is a differentiator when routine reporting is increasingly automated.",
    },
    {
      question: "Design a small experiment to test whether a product change improves activation.",
      category: "system_design",
      whatItTests: "Hypothesis design, metrics, bias, sample size, and interpretation.",
      strongAnswer: "Define the population, primary metric, guardrails, randomisation, duration, and what result would change the decision.",
      companySignal: "Strong candidates connect analysis to a business question, not just a chart.",
    },
  ],
  "mobile-flutter-react-native": [
    {
      question: "How do you handle offline state, retries, and a slow network in a mobile feature?",
      category: "technical",
      whatItTests: "Mobile resilience, lifecycle awareness, local state, and user feedback.",
      strongAnswer: "Describe a clear source of truth, queued or retryable work, idempotency, offline messaging, and how the UI recovers when connectivity returns.",
      companySignal: "A published app with real failure handling is stronger than a screenshot gallery.",
    },
    {
      question: "A list scrolls poorly on an older device. How do you profile and improve it?",
      category: "technical",
      whatItTests: "Rendering, memory, image handling, list virtualisation, and measurement.",
      strongAnswer: "Profile on a representative device, reduce unnecessary renders and payloads, optimise images, and verify frame performance after each change.",
      companySignal: "Mobile teams probe performance under constraints, not only layout skills.",
    },
    {
      question: "How would you ship a breaking API change while keeping the current app version working?",
      category: "system_design",
      whatItTests: "Versioning, release coordination, backwards compatibility, and testing.",
      strongAnswer: "Use additive API changes, capability/version negotiation, staged rollout, telemetry, and a deprecation plan.",
      companySignal: "Published apps make release discipline visible.",
    },
    {
      question: "What did you learn from a real user, crash report, or store review and how did you respond?",
      category: "behavioral",
      whatItTests: "Product ownership, feedback loops, and iteration.",
      strongAnswer: "Connect feedback to a shipped change and show how you measured whether it improved the user experience.",
      companySignal: "Employers want evidence that the candidate can ship beyond a local demo.",
    },
  ],
  "devops-cloud": [
    {
      question: "A deployment succeeds but the service returns 5xx errors. What is your first 15-minute response?",
      category: "technical",
      whatItTests: "Incident triage, logs, health checks, rollback judgement, and calm prioritisation.",
      strongAnswer: "Confirm blast radius, inspect logs and metrics, compare the release, protect users with rollback or mitigation, then preserve evidence for root cause analysis.",
      companySignal: "Cloud interviews reward safe operations over memorised service lists.",
    },
    {
      question: "How would you design a CI/CD pipeline that prevents an unsafe change from reaching production?",
      category: "system_design",
      whatItTests: "Quality gates, secrets, environments, approvals, and deployment strategy.",
      strongAnswer: "Include lint/tests, security checks, artifact immutability, environment separation, least-privilege secrets, staged rollout, and rollback.",
      companySignal: "A working pipeline is a much stronger signal than saying Docker or AWS.",
    },
    {
      question: "What is the difference between horizontal and vertical scaling, and when would you use each?",
      category: "technical",
      whatItTests: "Capacity reasoning, bottleneck diagnosis, and architecture fundamentals.",
      strongAnswer: "Relate the choice to state, cost, limits, fault tolerance, and the bottleneck you measured.",
      companySignal: "Systems and cloud screens test reasoning under realistic constraints.",
    },
    {
      question: "Tell me about a time you automated a repetitive or failure-prone engineering task.",
      category: "behavioral",
      whatItTests: "Initiative, leverage, safety, and measurable impact.",
      strongAnswer: "Show the old manual risk, the automation, guardrails, and a concrete time or failure-rate improvement.",
      companySignal: "Operational ownership differentiates early-career cloud candidates.",
    },
  ],
  "qa-automation": [
    {
      question: "A test passes locally but fails intermittently in CI. How do you make the failure diagnosable?",
      category: "technical",
      whatItTests: "Flake isolation, test determinism, environment control, and evidence.",
      strongAnswer: "Capture logs, traces, screenshots, timing, and environment details; remove shared state and fixed sleeps; then reproduce under controlled retries.",
      companySignal: "Automation hiring values reliable signal, not a large test count.",
    },
    {
      question: "What should be covered by API tests versus browser end-to-end tests?",
      category: "system_design",
      whatItTests: "Test pyramid judgement, coverage, speed, and risk prioritisation.",
      strongAnswer: "Put most business-rule coverage near the API or service boundary and reserve browser tests for critical user journeys and integration risk.",
      companySignal: "Strong QA engineers explain why a test exists and what risk it retires.",
    },
    {
      question: "How do you decide whether a bug should block a release?",
      category: "technical",
      whatItTests: "Risk assessment, severity, user impact, and communication.",
      strongAnswer: "Use reproducibility, affected users, data/security risk, workaround, release scope, and explicit stakeholder sign-off.",
      companySignal: "Decision quality matters more than treating every defect equally.",
    },
    {
      question: "Describe a quality improvement you introduced and how you proved it worked.",
      category: "behavioral",
      whatItTests: "Ownership, collaboration, and measurable quality outcomes.",
      strongAnswer: "Give a before/after metric such as escaped defects, runtime, flaky rate, or feedback cycle time.",
      companySignal: "A documented test strategy is stronger proof than a certification badge.",
    },
  ],
  "ui-ux-design": [
    {
      question: "How would you turn ambiguous user feedback into a design decision?",
      category: "behavioral",
      whatItTests: "Research synthesis, prioritisation, and evidence-based design.",
      strongAnswer: "Cluster the feedback, identify the underlying job, validate the riskiest assumption, and define a measurable success signal.",
      companySignal: "Product teams want evidence of user reasoning, not only polished screens.",
    },
    {
      question: "Show how you would improve a flow with a high drop-off rate.",
      category: "system_design",
      whatItTests: "Funnel analysis, usability, accessibility, and iteration.",
      strongAnswer: "Locate the drop-off, observe users, form hypotheses, prototype a focused change, and test it against a defined metric.",
      companySignal: "A portfolio should explain decisions and outcomes, not just display final visuals.",
    },
    {
      question: "How do you make a design usable for keyboard and screen-reader users?",
      category: "technical",
      whatItTests: "Accessibility fundamentals, inclusive interaction design, and implementation partnership.",
      strongAnswer: "Cover semantic structure, focus order, labels, contrast, states, error recovery, and testing with assistive technology.",
      companySignal: "Accessibility is increasingly an explicit hiring expectation.",
    },
    {
      question: "Tell me about a time research changed your original design direction.",
      category: "behavioral",
      whatItTests: "Humility, collaboration, and learning velocity.",
      strongAnswer: "State the original assumption, the evidence that challenged it, the changed design, and the outcome.",
      companySignal: "The ability to defend and revise a decision is a high-signal portfolio skill.",
    },
  ],
};

const GENERIC_QUESTIONS: InterviewQuestion[] = [
  {
    question: "Walk through the strongest project you have built, the hardest decision, and the evidence it works.",
    category: "behavioral",
    whatItTests: "Ownership, technical depth, and ability to communicate trade-offs.",
    strongAnswer: "Explain the user problem, architecture, constraint, decision, measurable outcome, and what you would improve.",
    companySignal: "Every employer can ask this; a deployed link and clear README make the answer credible.",
  },
  {
    question: "Solve a small problem out loud. How do you clarify requirements and verify your solution?",
    category: "technical",
    whatItTests: "Problem-solving process, communication, edge cases, and testing.",
    strongAnswer: "Ask clarifying questions, state an approach, discuss complexity, test examples and edge cases, then improve if needed.",
    companySignal: "Technical screens assess reasoning, not only the final code.",
  },
  {
    question: "How do you decide whether a technology is worth learning for your target role?",
    category: "system_design",
    whatItTests: "Market awareness, prioritisation, and ability to connect learning to outcomes.",
    strongAnswer: "Compare recurring job requirements, current evidence, project relevance, and the cost of learning it now.",
    companySignal: "Employers reward focused depth over a long unproven tools list.",
  },
  {
    question: "Tell me about feedback that changed how you work.",
    category: "behavioral",
    whatItTests: "Coachability, self-awareness, and growth mindset.",
    strongAnswer: "Give the feedback, the behaviour you changed, and the observable result.",
    companySignal: "This is a common final-round signal for early-career hiring.",
  },
];

export function getInterviewCompanies() {
  return FEATURED_COMPANIES.map((company) => ({ id: company.id, name: company.name }));
}

export function buildInterviewIntel(targetRole: string, companyName?: string | null): InterviewIntel {
  const roleProfile: RoleTruthProfile = resolveRoleProfile(targetRole || "Technology role");
  const company = matchCompanyTruth(companyName);
  const questions = (ROLE_QUESTIONS[roleProfile.roleId] ?? GENERIC_QUESTIONS).map((question) => ({
    ...question,
    companySignal: question.companySignal.replace("Every employer", `${company.name} and most employers`),
  }));

  return {
    role: roleProfile.displayName,
    company: company.name,
    companyTagline: company.tagline,
    stages: company.hiringBar.evaluationStages,
    focusAreas: [
      ...company.interviewPreparation.dsaFocus.slice(0, 2),
      ...company.interviewPreparation.coreTheory.slice(0, 3),
      ...company.interviewPreparation.behavioralKeys.slice(0, 2),
    ],
    questions,
    note: "These are evidence-backed practice prompts synthesized from the role and employer hiring standards in CareerPilot's research dataset, not leaked interview questions.",
  };
}
