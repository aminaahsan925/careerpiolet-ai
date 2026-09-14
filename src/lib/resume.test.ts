import { describe, it, expect } from "vitest";
import { auditResumeFormat } from "./resume.server";

describe("auditResumeFormat", () => {
  const goodResume = `
John Doe
john.doe@email.com
+1-555-123-4567
github.com/johndoe
linkedin.com/in/johndoe

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2024

EXPERIENCE
Software Engineering Intern | Tech Corp | 2023-2024
- Built REST API handling 10k requests/day with 99.9% uptime
- Reduced database query latency by 40% through indexing
- Automated CI/CD pipeline saving 5 hours/week
- Developed microservices architecture serving 50k daily active users
- Implemented comprehensive monitoring with Prometheus and Grafana
- Optimized database queries reducing p99 latency from 500ms to 50ms

PROJECTS
E-Commerce Platform | github.com/johndoe/ecommerce
- Developed full-stack app with React, Node.js, PostgreSQL
- Implemented payment processing for 100+ transactions/day
- Achieved 95% test coverage with Jest and Cypress
- Built real-time inventory management with WebSocket connections
- Integrated third-party APIs for shipping and tax calculation
- Deployed to AWS with Docker and Kubernetes orchestration

SKILLS
TypeScript, React, Node.js, PostgreSQL, Docker, AWS, Kubernetes, GraphQL, Redis, Terraform
`;

  const badResume = `
John Doe
I am a hard worker and team player
Responsible for coding stuff
Worked on many projects
Familiar with JavaScript
`;

  it("passes contact details check for complete resume", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const contact = checks.find((c) => c.label === "Contact details");
    expect(contact?.status).toBe("pass");
  });

  it("fails contact details for missing email", () => {
    const { checks } = auditResumeFormat(badResume, "resume.pdf");
    const contact = checks.find((c) => c.label === "Contact details");
    expect(contact?.status).toBe("fail");
  });

  it("passes proof links when GitHub and LinkedIn present", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const links = checks.find((c) => c.label === "Proof links");
    expect(links?.status).toBe("pass");
  });

  it("passes quantified impact with 3+ numeric bullets", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const impact = checks.find((c) => c.label === "Quantified impact");
    expect(impact?.status).toBe("pass");
  });

  it("fails quantified impact for duty-list resume", () => {
    const { checks } = auditResumeFormat(badResume, "resume.pdf");
    const impact = checks.find((c) => c.label === "Quantified impact");
    expect(impact?.status).toBe("fail");
  });

  it("passes action verbs check with strong verbs", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const verbs = checks.find((c) => c.label === "Action verbs");
    expect(verbs?.status).toBe("pass");
  });

  it("fails filler phrases detection", () => {
    const { checks } = auditResumeFormat(badResume, "resume.pdf");
    const filler = checks.find((c) => c.label === "Filler phrases");
    expect(filler?.status).toBe("fail");
  });

  it("passes standard sections check", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const sections = checks.find((c) => c.label === "Standard sections");
    expect(sections?.status).toBe("pass");
  });

  it("passes bullet structure with 6+ bullets", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const bullets = checks.find((c) => c.label === "Bullet structure");
    expect(bullets?.status).toBe("pass");
  });

  it("passes text layer check for text-based PDF", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const textLayer = checks.find((c) => c.label === "Text layer");
    expect(textLayer?.status).toBe("pass");
  });

  it("passes single-column layout check", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const layout = checks.find((c) => c.label === "Single-column layout");
    expect(layout?.status).toBe("pass");
  });

  it("passes professional voice check (no first-person)", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const voice = checks.find((c) => c.label === "Professional voice");
    expect(voice?.status).toBe("pass");
  });

  it("passes no bias-risk details check", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const bias = checks.find((c) => c.label === "No bias-risk details");
    expect(bias?.status).toBe("pass");
  });

  it("passes file format check for PDF", () => {
    const { checks } = auditResumeFormat(goodResume, "resume.pdf");
    const format = checks.find((c) => c.label === "File format");
    expect(format?.status).toBe("pass");
  });

  it("computes format score correctly", () => {
    const { formatScore } = auditResumeFormat(goodResume, "resume.pdf");
    expect(formatScore).toBeGreaterThan(70);
  });
});