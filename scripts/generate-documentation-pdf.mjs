/**
 * CareerPilot AI - Full product documentation PDF generator.
 *
 * Rebuilds output/pdf/careerpilot-ai-supporting-documentation.pdf and the
 * root-level and public CareerPilot-AI-Hackathon-Documentation.pdf files. The
 * document is written for hackathon judges, evaluators, mentors, and future
 * contributors. It explains the problem, product workflow, every major
 * feature, diagnostic and resume intelligence, architecture, data model,
 * security, demonstration flow, and next steps.
 *
 * Usage: npm run docs:pdf
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "pdf");
const OUT_FILE = path.join(OUT_DIR, "careerpilot-ai-supporting-documentation.pdf");
const ROOT_FILE = path.join(ROOT, "CareerPilot-AI-Hackathon-Documentation.pdf");
const PUBLIC_FILE = path.join(ROOT, "public", "CareerPilot-AI-Hackathon-Documentation.pdf");

// Brand palette converted from the OKLCH tokens in src/styles.css.
const COLOR = {
  ink: "#131313",
  primary: "#984c30", // --primary
  accent: "#b46a49", // --accent
  cream: "#f9f7f3", // --background
  secondary: "#f3f0ea", // --secondary
  muted: "#6c6864", // --muted-foreground
  border: "#e5e0d8",
  white: "#ffffff",
};

const HACKATHON = "ALIBABA CLOUD AI HACKATHON PAKISTAN 2026";
const DOC_DATE = "September 2026";
const LIVE_URL = "https://careerpiolet-ai.vercel.app";
const REPO_URL = "https://github.com/aminaahsan925/careerpiolet-ai";

const MARGIN = 56;
const TOP_Y = 64;
const CONTENT_WIDTH = 595.28 - MARGIN * 2; // A4 width minus margins

const WINDOWS_FONTS = path.join(process.env.WINDIR ?? "C:\\Windows", "Fonts");

/** Embed familiar fonts so PDF viewers do not substitute a cramped fallback. */
function registerDocumentFonts(doc) {
  const fonts = [
    ["Body", path.join(WINDOWS_FONTS, "arial.ttf")],
    ["Body-Bold", path.join(WINDOWS_FONTS, "arialbd.ttf")],
    ["Body-Italic", path.join(WINDOWS_FONTS, "ariali.ttf")],
    ["Body-BoldItalic", path.join(WINDOWS_FONTS, "arialbi.ttf")],
    ["Helvetica", path.join(WINDOWS_FONTS, "arial.ttf")],
    ["Helvetica-Bold", path.join(WINDOWS_FONTS, "arialbd.ttf")],
    ["Helvetica-Oblique", path.join(WINDOWS_FONTS, "ariali.ttf")],
    ["Helvetica-BoldOblique", path.join(WINDOWS_FONTS, "arialbi.ttf")],
  ];
  if (fonts.every(([, file]) => fs.existsSync(file))) {
    fonts.forEach(([name, file]) => doc.registerFont(name, file));
  }
}

/* -------------------------------------------------------------- helpers */

/** Letter-spaced small-caps label. Restores the text cursor afterwards. */
function tracking(doc, text, x, y, opts = {}) {
  const prevX = doc.x;
  const prevY = doc.y;
  const spaced = text.split("").join(" ");
  doc
    .font("Helvetica-Bold")
    .fontSize(opts.size ?? 8)
    .fillColor(opts.color ?? COLOR.muted)
    .text(spaced, x, y, {
      width: opts.width ?? CONTENT_WIDTH,
      align: opts.align ?? "left",
      lineBreak: false,
    });
  doc.x = prevX;
  doc.y = prevY;
}

/** Rounded panel used for callouts. Does not move the text cursor. */
function panel(doc, x, y, w, h, fill = COLOR.secondary, stroke = COLOR.border) {
  doc.save();
  doc.lineWidth(0.75);
  if (fill) doc.fillColor(fill).roundedRect(x, y, w, h, 8).fill();
  if (stroke) doc.strokeColor(stroke).roundedRect(x, y, w, h, 8).stroke();
  doc.restore();
}

/** Horizontal rule. Does not move the text cursor. */
function rule(doc, x, y, w, color = COLOR.border, width = 0.5) {
  doc.save();
  doc
    .moveTo(x, y)
    .lineTo(x + w, y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke();
  doc.restore();
}

/** Start a new page with the standard top offset. */
function newPage(doc) {
  doc.addPage();
  doc.y = TOP_Y;
  doc.x = MARGIN;
}

/** Move to a new page when not enough vertical room remains. */
function ensureRoom(doc, needed) {
  if (doc.y + needed > doc.page.height - 100) newPage(doc);
}

/** Numbered section heading with kicker and rule. */
function sectionHeading(doc, num, title) {
  ensureRoom(doc, 110);
  tracking(doc, `SECTION ${num}`, MARGIN, doc.y, { size: 7.5, color: COLOR.primary });
  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor(COLOR.ink)
    .text(`${num}. ${title}`, MARGIN, doc.y + 16, { width: CONTENT_WIDTH });
  rule(doc, MARGIN, doc.y + 6, CONTENT_WIDTH, COLOR.primary, 1.2);
  doc.y += 20;
}

/** Start a major section on a predictable page with enough room for content. */
function sectionStart(doc, num, title, opts = {}) {
  // Give every major section a reliable visual starting point. Without this,
  // a section can begin at the bottom of a previous page and its continuation
  // can look like an empty or broken divider page in PDF viewers.
  if (opts.pageBreak ?? true) newPage(doc);
  else ensureRoom(doc, opts.minimumRoom ?? 190);
  sectionHeading(doc, num, title);
}

/** Justified body paragraph. */
function paragraph(doc, text, opts = {}) {
  const size = opts.size ?? 9.5;
  ensureRoom(doc, size * 3);
  doc
    .font(opts.bold ? "Body-Bold" : "Body")
    .fontSize(size)
    .fillColor(opts.color ?? COLOR.ink)
    .text(text, MARGIN, doc.y, { width: CONTENT_WIDTH, align: "left", lineGap: 3.5 });
  doc.y += opts.after ?? 10;
}

/** Bulleted list. */
function bullets(doc, items, opts = {}) {
  const size = opts.size ?? 9.5;
  items.forEach((item) => {
    ensureRoom(doc, size * 2);
    const y = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(size)
      .fillColor(COLOR.primary)
      .text("•", MARGIN, y, { lineBreak: false });
    doc
      .font("Body")
      .fontSize(size)
      .fillColor(COLOR.ink)
      .text(item, MARGIN + 16, y, { width: CONTENT_WIDTH - 16, align: "left", lineGap: 3 });
    doc.y = Math.max(doc.y, y + size * 1.35) + (opts.gap ?? 5);
  });
}

/** Two-column card grid used for journey steps. */
function stepGrid(doc, entries) {
  const cardW = (CONTENT_WIDTH - 14) / 2;
  const cardH = 92;
  for (let i = 0; i < entries.length; i += 2) {
    ensureRoom(doc, cardH + 14);
    const rowY = doc.y;
    for (let j = 0; j < 2 && i + j < entries.length; j++) {
      const entry = entries[i + j];
      const x = MARGIN + j * (cardW + 14);
      panel(doc, x, rowY, cardW, cardH);
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(COLOR.primary)
        .text(String(i + j + 1).padStart(2, "0"), x + 12, rowY + 10, { lineBreak: false });
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLOR.ink)
        .text(entry.title, x + 42, rowY + 10, { width: cardW - 54, lineGap: 1.5 });
      doc
        .font("Body")
        .fontSize(8.5)
        .fillColor(COLOR.muted)
        .text(entry.body, x + 12, rowY + 32, { width: cardW - 24, align: "left", lineGap: 2.5 });
    }
    doc.y = rowY + cardH + 12;
  }
}

/** Key/value table with header rule and row separators. */
function table(doc, headers, rows, widths) {
  ensureRoom(doc, 70);
  tracking(doc, headers[0].toUpperCase(), MARGIN, doc.y, { size: 7, color: COLOR.muted });
  tracking(doc, headers[1].toUpperCase(), MARGIN + widths[0], doc.y, {
    size: 7,
    color: COLOR.muted,
  });
  doc.y += 14;
  rule(doc, MARGIN, doc.y - 4, CONTENT_WIDTH, COLOR.primary, 0.8);
  rows.forEach((row) => {
    ensureRoom(doc, 36);
    const rowY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(COLOR.ink)
      .text(row[0], MARGIN, rowY, { width: widths[0] - 8, lineGap: 2.5 });
    const afterLeft = doc.y;
    doc
      .font("Body")
      .fontSize(8.5)
      .fillColor(COLOR.muted)
      .text(row[1], MARGIN + widths[0], rowY, {
        width: widths[1] - 8,
        align: "left",
        lineGap: 2.5,
      });
    doc.y = Math.max(doc.y, afterLeft) + 9;
    rule(doc, MARGIN, doc.y - 5, CONTENT_WIDTH);
  });
  doc.y += 4;
}

/** Title + body rows separated by hairlines (used in sections 7, 10, 11). */
function titledRows(doc, rows) {
  rows.forEach((r) => {
    ensureRoom(doc, 76);
    const y = doc.y;
    rule(doc, MARGIN, y + 2, CONTENT_WIDTH);
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(COLOR.primary)
      .text(r.title, MARGIN, y + 8, { width: CONTENT_WIDTH - 28 });
    doc
      .font("Body")
      .fontSize(8.5)
      .fillColor(COLOR.muted)
      .text(r.body, MARGIN, y + 22, { width: CONTENT_WIDTH - 28, align: "left", lineGap: 2.5 });
    const est = 22 + Math.ceil(r.body.length / 95) * 12;
    doc.y = y + 8 + Math.max(38, est);
  });
}

/** Callout panel with a label and an emphasized quote. */
function quotePanel(doc, label, quote, opts = {}) {
  const height = opts.height ?? 78;
  ensureRoom(doc, height + 14);
  const top = doc.y;
  panel(
    doc,
    MARGIN,
    top,
    CONTENT_WIDTH,
    height,
    opts.fill ?? COLOR.cream,
    opts.stroke ?? COLOR.primary,
  );
  tracking(doc, label, MARGIN + 14, top + 12, { size: 7, color: opts.labelColor ?? COLOR.primary });
  doc
    .font(opts.font ?? "Body-BoldItalic")
    .fontSize(opts.size ?? 10.5)
    .fillColor(opts.textColor ?? COLOR.ink)
    .text(quote, MARGIN + 14, top + 30, {
      width: CONTENT_WIDTH - 28,
      align: "left",
      lineGap: 3.5,
    });
  doc.y = top + height + 14;
}

/**
 * Draw text at an absolute position that may sit below the bottom margin.
 * PDFKit auto-adds a page when text lands past maxY, so the margin is
 * zeroed for the duration of the call (the approach used by PDFKit's own
 * page-number examples).
 */
function absoluteText(doc, str, x, y, opts) {
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.text(str, x, y, opts);
  doc.page.margins.bottom = oldBottom;
}

/** Draw the running footer on one physical page (0-based index). */
function drawFooter(doc, pageDisplay) {
  const y = doc.page.height - 40;
  doc.save();
  doc.font("Body").fontSize(7.5).fillColor(COLOR.muted);
  absoluteText(doc, "CAREERPILOT AI  |  ALIBABA CLOUD AI HACKATHON PAKISTAN 2026", MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "left",
    lineBreak: false,
  });
  absoluteText(doc, String(pageDisplay).padStart(2, "0"), MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "right",
    lineBreak: false,
  });
  doc.restore();
}

/* ----------------------------------------------------------------- cover */

function drawCover(doc) {
  const W = doc.page.width;
  const H = doc.page.height;
  doc.rect(0, 0, W, H).fill(COLOR.ink);
  doc.save();
  doc.lineWidth(1.2).strokeColor(COLOR.accent);
  doc
    .moveTo(MARGIN, 92)
    .lineTo(W - MARGIN, 92)
    .stroke();
  doc
    .moveTo(MARGIN, H - 92)
    .lineTo(W - MARGIN, H - 92)
    .stroke();
  doc.restore();

  tracking(doc, HACKATHON, MARGIN, 72, { size: 8, color: "#c9b8a8", align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(44)
    .fillColor(COLOR.white)
    .text("CareerPilot AI", MARGIN, 200, { width: CONTENT_WIDTH, align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(13.5)
    .fillColor(COLOR.accent)
    .text("Precision Career Intelligence", MARGIN, 266, { width: CONTENT_WIDTH, align: "center" });

  doc
    .font("Body")
    .fontSize(11)
    .fillColor("#e8e4de")
    .text("From career confusion to a clear, evidence-based path toward employment.", MARGIN, 312, {
      width: CONTENT_WIDTH,
      align: "center",
      lineGap: 4,
    });

  doc
    .font("Body")
    .fontSize(10)
    .fillColor("#b9b2a9")
    .text(
      "A career readiness workspace for students, graduates, and early-career professionals.",
      MARGIN,
      350,
      {
        width: CONTENT_WIDTH,
        align: "center",
      },
    );

  doc.save();
  doc
    .fillColor(COLOR.primary)
    .circle(W / 2, 404, 3.2)
    .fill();
  doc.restore();

  doc
    .font("Body")
    .fontSize(9.5)
    .fillColor("#c9c2ba")
    .text(`Supporting documentation for project submission  •  ${DOC_DATE}`, MARGIN, 424, {
      width: CONTENT_WIDTH,
      align: "center",
    });

  doc.font("Body").fontSize(9).fillColor("#8d857c");
  absoluteText(doc, `Live demo: ${LIVE_URL}`, MARGIN, H - 82, {
    width: CONTENT_WIDTH,
    align: "center",
    lineBreak: false,
  });
  absoluteText(doc, `Source code: ${REPO_URL}`, MARGIN, H - 66, {
    width: CONTENT_WIDTH,
    align: "center",
    lineBreak: false,
  });
}

/* ------------------------------------------------------------------- toc */

function drawTableOfContents(doc) {
  newPage(doc);
  tracking(doc, "CONTENTS", MARGIN, doc.y, { size: 9, color: COLOR.primary });
  doc.y += 24;
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLOR.ink)
    .text("Table of Contents", MARGIN, doc.y, { width: CONTENT_WIDTH });
  rule(doc, MARGIN, doc.y + 12, CONTENT_WIDTH, COLOR.primary, 1.2);
  doc.y += 34;

  const entries = [
    ["1", "Executive Summary"],
    ["2", "Problem, Audience, and Context"],
    ["3", "Product Model and User Journey"],
    ["4", "Onboarding and Career Profile"],
    ["5", "Dashboard and Career State"],
    ["6", "Career Diagnosis and Readiness"],
    ["7", "Market Reality and Future Tech"],
    ["8", "Roadmap and Daily Execution"],
    ["9", "Flight Plan and Job Readiness"],
    ["10", "Resume Intelligence and ATS"],
    ["11", "Interview Preparation and Job Mirror"],
    ["12", "Recruiter Audit"],
    ["13", "AI Mentor and Progress System"],
    ["14", "Technical Architecture and Security"],
    ["15", "Data Model and Persistence"],
    ["16", "Demonstration and Evaluation Guide"],
    ["17", "Impact, Feasibility, and Next Steps"],
  ];
  entries.forEach(([num, title]) => {
    ensureRoom(doc, 22);
    const y = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLOR.primary)
      .text(num, MARGIN, y, { width: 24, lineBreak: false });
    doc
      .font("Body")
      .fontSize(10)
      .fillColor(COLOR.ink)
      .text(title, MARGIN + 28, y, { width: CONTENT_WIDTH - 28, lineBreak: false });
    doc.y = y + 21;
  });

  doc.y += 12;
  quotePanel(
    doc,
    "HOW TO READ THIS DOCUMENT",
    "This document is a complete guide to the deployed prototype. It is organized around the actual product experience so a reader can understand what the student sees, what the system stores, how AI is used, and what a judge can verify.",
    { height: 74, font: "Body", size: 8.5, fill: COLOR.secondary, stroke: COLOR.border },
  );
}

/* -------------------------------------------------------------- sections */

function section1(doc) {
  newPage(doc);
  sectionHeading(doc, 1, "Executive Summary");
  paragraph(
    doc,
    "CareerPilot AI helps students understand why they are unemployed and what they should do to become job-ready. Instead of offering generic courses or motivational advice, the platform compares a student's current profile with the expectations of a selected role and company. It turns identified gaps into a practical roadmap with daily learning, portfolio work, assessments, interview preparation, and recruiter-style feedback.",
  );
  paragraph(
    doc,
    "The project focuses on the gap between education and employability. Students may have degrees, certificates, and theoretical knowledge, but employers look for evidence: real projects, problem-solving, deployment, communication, and the ability to explain technical decisions. CareerPilot connects market reality, personal diagnosis, execution, and proof in one accessible workspace.",
  );
  quotePanel(
    doc,
    "CORE PROMISE",
    "Where am I now? Why am I being rejected? What does my target company expect? What should I learn, build, and practice next?",
  );
  paragraph(
    doc,
    "The prototype is deployed and end-to-end usable: a judge can register, complete onboarding, run a diagnosis, inspect market reality for a target role and company, generate a personalized roadmap, complete daily work, practice interviews, and receive recruiter-style feedback in a single session.",
  );
}

function section2(doc) {
  sectionStart(doc, 2, "Problem, Audience, and Context");
  paragraph(
    doc,
    "Students in Pakistan and other emerging markets often learn without a clear target. They do not know which skills matter for a specific job, why applications fail, what projects employers value, or how to prepare for interviews. Students outside major cities may also lack access to mentors, professional networks, and expensive career programs.",
  );
  paragraph(
    doc,
    "The result is a costly mismatch: months spent learning skills the market no longer asks for, resumes that never pass automated screening, and interviews that end at the first technical question. Existing tools address single fragments of this problem — job boards list openings, course platforms sell content, resume builders format text — but none of them connect a student's actual evidence to what a specific employer will actually screen for.",
  );

  const personas = [
    "University students choosing a direction before graduation",
    "Recent graduates facing rejection without feedback",
    "Self-taught developers proving skills without a CS degree",
    "Career switchers entering tech from other fields",
    "Universities and training organizations seeking a structured employability journey",
  ];
  ensureRoom(doc, 150);
  const top = doc.y;
  panel(doc, MARGIN, top, CONTENT_WIDTH, 118);
  tracking(doc, "WHO IT IS FOR", MARGIN + 14, top + 12, { size: 7 });
  personas.forEach((p, i) => {
    const py = top + 32 + i * 17.5;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLOR.primary)
      .text("—", MARGIN + 14, py, { lineBreak: false });
    doc
      .font("Body")
      .fontSize(9)
      .fillColor(COLOR.ink)
      .text(p, MARGIN + 30, py, { width: CONTENT_WIDTH - 44, lineBreak: false });
  });
  doc.y = top + 130;

  paragraph(
    doc,
    "For institutions, CareerPilot offers a repeatable framework: every learner's readiness, gaps, and progress become measurable instead of anecdotal. This makes the platform relevant beyond individual use and into employability programs at scale.",
  );
}

function section3(doc) {
  sectionStart(doc, 3, "Solution and User Journey");
  paragraph(doc, "CareerPilot converts uncertainty into a sequence of decisions and actions:", {
    after: 14,
  });
  stepGrid(doc, [
    {
      title: "Understand",
      body: "Onboarding captures education, experience, skills, projects, certifications, and career goals.",
    },
    {
      title: "Diagnose",
      body: "The platform identifies missing skills, weak proof, outdated knowledge, and rejection risks.",
    },
    {
      title: "Compare",
      body: "Market Reality connects the student with role, company, Pakistan, and global hiring expectations.",
    },
    {
      title: "Execute",
      body: "A personalized roadmap provides daily learning, practical tasks, and portfolio-focused projects.",
    },
    {
      title: "Practice",
      body: "MCQs, interview preparation, and recruiter simulation turn knowledge into confident evidence.",
    },
    {
      title: "Progress",
      body: "Assessments, notifications, readiness, and completion tracking make progress visible.",
    },
  ]);
  paragraph(
    doc,
    "Every stage feeds the next. The diagnosis defines the gap, the market reality defines the target, the roadmap defines the work, and assessments plus recruiter feedback verify that the work produced believable proof. No stage treats the student as a blank slate.",
  );
}

function section4(doc) {
  sectionStart(doc, 4, "Key Capabilities");
  bullets(doc, [
    "Personalized career diagnosis with role and company context.",
    "Pakistan-focused Market Reality covering employer expectations, salary benchmarks, and practical opportunities.",
    "Day-by-day roadmap with learning explanations, hands-on tasks, and project evidence.",
    "Scenario-based MCQ assessments with scores, explanations, and attempt history.",
    "Interview preparation for technical, behavioral, project-defense, and company-specific questions.",
    "Resume Intelligence with ATS signals, structure review, detected skills, and career-fit analysis.",
    "Flight Plan readiness assessment that compares a live job description against recorded evidence.",
    "Recruiter Audit that explains how a student's profile may be screened, with persistent recruiter chat.",
    "Progress tracking, notifications, roadmap completion, and certificate unlocking.",
    "Responsive experience for desktop and mobile users.",
  ]);
  doc.y += 4;
  paragraph(
    doc,
    "Each capability operates on the same underlying career state, so evidence captured once — a project, a skill, a resume — strengthens every later analysis. This shared-state design is what keeps the advice specific instead of generic.",
  );
}

function section5(doc) {
  sectionStart(doc, 5, "Innovation");
  paragraph(
    doc,
    "CareerPilot is not only a course platform, chatbot, resume tool, or job board. Its innovation is the connection between diagnosis, market reality, learning execution, assessment, interview preparation, recruiter feedback, and proof. The platform helps a student move from knowing about a skill to demonstrating that skill in a way an employer can understand.",
  );
  paragraph(
    doc,
    "Three design decisions differentiate it from the fragmented tools students otherwise stitch together:",
    { after: 12 },
  );

  titledRows(doc, [
    {
      title: "Evidence over claims",
      body: "The system separates claimed skills from demonstrated proof. A student can list React, but the Recruiter Audit asks what deployed, measurable work backs the claim — the same question a hiring manager asks.",
    },
    {
      title: "Local market grounding",
      body: "Market Reality reports cite Pakistani on-site, remote-international, and global salary bands and expectations per role, so guidance is not imported wholesale from foreign job boards.",
    },
    {
      title: "Research with citations",
      body: "Live web research (Tavily) is cached per role and company. Findings carry sources, and claims fall back to the listed aggregators instead of invented numbers.",
    },
  ]);

  paragraph(
    doc,
    "The result is a closed feedback loop: understand, diagnose, compare, execute, practice, and prove — with the market, not a static curriculum, as the reference point.",
  );
}

function section6(doc) {
  sectionStart(doc, 6, "Technology and Architecture");
  paragraph(
    doc,
    "The working prototype uses a modern full-stack architecture designed for maintainability, security, and future scale. The client uses React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, and Motion. Supabase provides authentication, Postgres persistence, storage, Row Level Security, user profiles, career goals, skills, projects, resumes, roadmaps, assessments, notifications, and recruiter sessions.",
  );
  paragraph(
    doc,
    "Server functions protect sensitive operations and keep AI credentials away from the browser. The AI layer supports Groq, Gemini, and OpenRouter providers with fallback handling, so a provider outage degrades gracefully instead of failing the user journey. Market and technology reports are cached to reduce repeated requests and improve loading performance. Server-side validation protects assessment results and user-scoped data.",
  );
  table(
    doc,
    ["Layer", "Implemented approach"],
    [
      [
        "Experience",
        "Responsive React screens, mobile navigation, dashboard, roadmap, diagnosis, interview, recruiter, resume, and market workflows.",
      ],
      [
        "Application",
        "TanStack Router, TanStack Query, reusable components, server functions, loading states, and cached queries.",
      ],
      [
        "Data",
        "Supabase authentication, PostgreSQL persistence, user-scoped records, roadmap progress, MCQ attempts, and notifications.",
      ],
      [
        "Intelligence",
        "Multi-provider AI generation for diagnosis, roadmaps, market analysis, recruiter feedback, and interview practice, with Tavily-backed live research.",
      ],
    ],
    [110, CONTENT_WIDTH - 110],
  );
  doc.y += 8;
  paragraph(
    doc,
    "Deployment is serverless on Vercel. All privileged keys are server-side environment secrets; only publishable Supabase credentials reach the browser. Every table and storage bucket is scoped to its owning user through RLS policies.",
  );
}

function section7(doc) {
  sectionStart(doc, 7, "What Has Been Built");
  paragraph(
    doc,
    "CareerPilot is a working, deployed prototype rather than a concept-only proposal. The implemented product includes authentication, onboarding, target role selection, Pakistani and international company selection, custom company entry, career diagnosis, market analysis, personalized roadmaps, daily tasks, MCQ assessments, interview preparation, recruiter simulation, resume analysis, notifications, progress tracking, certificate unlocking, and mobile-responsive layouts.",
  );
  paragraph(
    doc,
    "The surface area is intentionally deep rather than wide: thirteen authenticated routes cover the full journey, and each route operates on real persisted data rather than mock screens.",
    { after: 12 },
  );
  titledRows(doc, [
    {
      title: "Diagnosis & Profile",
      body: "Structured intake of education, experience, projects, skills, and blockers with market benchmark comparison.",
    },
    {
      title: "Resume Intelligence",
      body: "Upload with parsing, ATS signals, structure, strengths, weaknesses, detected skills, and career-match.",
    },
    {
      title: "Flight Plan",
      body: "Job-description readiness assessment combining role expectations, skill coverage, resume evidence, and market context.",
    },
    {
      title: "Job Mirror",
      body: "Employer expectations per researched role, separating claimed skills from demonstrated proof.",
    },
    {
      title: "Recruiter Audit",
      body: "Company-specific screening perspective with persisted sessions and recruiter conversation.",
    },
    {
      title: "Roadmap",
      body: "Personalized day-by-day learning with practical tasks, completion tracking, and certificates.",
    },
    {
      title: "Market & Future Tech",
      body: "Role salary benchmarks, demand signals, emerging tech radar, and outdated-tech warnings.",
    },
    {
      title: "Mentor",
      body: "Context-aware guidance initialized from the same career state as every other module.",
    },
  ]);
}

function section8(doc) {
  sectionStart(doc, 8, "Impact and Feasibility");
  paragraph(
    doc,
    "CareerPilot can reduce wasted learning time, improve student confidence, and make career guidance more accessible. For universities and training organizations, it provides a structured employability journey. The architecture is modular, cloud-ready, and capable of expanding with more roles, employers, market sources, learning paths, and assessment content.",
  );
  paragraph(doc, "The near-term impact model is concrete:", { after: 12 });
  bullets(doc, [
    "Time-to-readiness becomes visible: each student sees the distance between current proof and target-role expectations instead of guessing.",
    "Rejection becomes information: the diagnosis and recruiter audit convert 'we moved on with other candidates' into specific, fixable causes.",
    "Learning becomes accountable: daily roadmap work with completion tracking replaces open-ended course enrollments.",
    "Guidance becomes scalable: one mentor session is amplified by an AI layer that remembers each student's full context.",
  ]);
  doc.y += 4;
  paragraph(
    doc,
    "Feasibility rests on proven, low-cost infrastructure. Supabase's free tier covers hackathon-scale usage; AI inference is provider-agnostic with fallback; research results are cached per role and company to control API spend. The marginal cost of each additional student is low, and every AI response is designed to degrade gracefully when a provider is unavailable, keeping the core journey functional under constraint.",
  );
}

function section9(doc) {
  sectionStart(doc, 9, "Demonstration Flow");
  paragraph(
    doc,
    "A judge can understand the complete value of CareerPilot through this short product journey:",
    { after: 12 },
  );
  const steps = [
    "Create or open a student profile and complete onboarding.",
    "Choose a target role and company, including a custom company.",
    "Run a career diagnosis and review the rejection risks.",
    "Open Market Reality to see what the selected role requires, with salary bands and sources.",
    "Generate the personalized roadmap.",
    "Open a roadmap day and complete the practical task.",
    "Take the role-specific MCQ and review correct answers and explanations.",
    "Practice an interview question and ask the recruiter simulator for feedback.",
    "Review progress, notifications, and certificate completion status.",
  ];
  steps.forEach((step, i) => {
    ensureRoom(doc, 32);
    const y = doc.y;
    doc.save();
    doc
      .fillColor(COLOR.cream)
      .circle(MARGIN + 11, y + 9, 10)
      .fill();
    doc.restore();
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(COLOR.primary)
      .text(String(i + 1), MARGIN + 7, y + 4.5, { lineBreak: false });
    doc
      .font("Body")
      .fontSize(9.5)
      .fillColor(COLOR.ink)
      .text(step, MARGIN + 32, y + 5, { width: CONTENT_WIDTH - 32 });
    doc.y = y + 27;
  });
  doc.y += 4;
  paragraph(
    doc,
    "The full journey runs in under fifteen minutes on the deployed URL and requires no special preparation. A fallback demo account is available on request if registration emails are delayed.",
  );
}

/* ------------------------------------------------ section 10: the new part */

function section10(doc) {
  sectionStart(doc, 10, "Winning Strategy");
  paragraph(
    doc,
    "This section states plainly why CareerPilot AI is a strong hackathon entry and how it is positioned to win. It is organized around the criteria judges typically apply: problem significance, working execution, technical depth, innovation, and presentation.",
  );
  quotePanel(
    doc,
    "THE ONE-LINE PITCH",
    "CareerPilot AI is the only entry that closes the loop from evidence to employability: diagnose the gap, ground it in the live market, execute daily, and prove it to a recruiter — all shipped and deployed.",
    {
      height: 82,
      fill: COLOR.ink,
      stroke: COLOR.ink,
      labelColor: COLOR.accent,
      textColor: COLOR.white,
      font: "Helvetica-Bold",
      size: 10.5,
    },
  );

  paragraph(doc, "Five strategic advantages", { bold: true, after: 10 });
  titledRows(doc, [
    {
      title: "1. A real problem, precisely framed",
      body: "Graduate unemployment in Pakistan is not abstract; it is measurable and personal. CareerPilot addresses it with a specific mechanism — evidence-based readiness — rather than another content library. Judges can verify the problem with one question to any student.",
    },
    {
      title: "2. Shipped, not slideware",
      body: "The product is deployed end-to-end with authentication, persisted data, RLS-secured tables, and thirteen working routes. Every claim in this document is clickable on the live URL. In a field of mockups, a working system is the fastest trust signal.",
    },
    {
      title: "3. Technical depth under a simple UX",
      body: "Beneath a clean interface sits real engineering: multi-provider AI fallback, cached Tavily research with citations, server-only credential handling, server-validated assessments, and a schema with per-user row-level security. Depth is documented in Section 6 and visible in the repository.",
    },
    {
      title: "4. Local grounding with global standards",
      body: "Market Reality speaks to Pakistani salary bands and hiring realities while tracking global frontier tech. This dual lens matches the hackathon theme — AI built for Pakistan's future — without lowering the technical bar.",
    },
    {
      title: "5. A demo that tells a story",
      body: "The nine-step demonstration flow (Section 9) walks a judge from confusion to certificate in one sitting. Every screen answers the previous screen's question, which keeps attention and makes the value self-evident.",
    },
  ]);

  // Section 10 is intentionally long. If the first page is full, label the
  // continuation instead of leaving a page that looks like an orphaned tail.
  ensureRoom(doc, 150);
  if (doc.y <= TOP_Y + 8) sectionHeading(doc, 10, "Winning Strategy - continued");
  paragraph(doc, "Risk mitigation and honesty", { bold: true, after: 10 });
  titledRows(doc, [
    {
      title: "No fabricated numbers",
      body: "Market figures come from cited research with named sources; when live data is unavailable, the system falls back to the listed aggregators rather than inventing values. Credibility is treated as a feature.",
    },
    {
      title: "Graceful degradation",
      body: "If an AI provider rate-limits during judging, the platform degrades to cached research and fallback analysis instead of erroring out. The demo cannot be killed by a third-party outage.",
    },
    {
      title: "Scoped ambition",
      body: "The prototype deliberately executes one journey deeply instead of many shallow ones. Post-hackathon expansion (Section 11) is sequenced, not hand-waved.",
    },
  ]);

  paragraph(doc, "What a judge can verify in the live product", { bold: true, after: 8 });
  bullets(doc, [
    "A target role and company are carried from onboarding into diagnosis, market reality, roadmap, and recruiter feedback.",
    "A practical task can be completed and its progress remains visible after navigation or refresh.",
    "Assessment results include explanations, while recruiter feedback is tied to the student's stored evidence.",
    "The public repository and deployed application make the architecture, security model, and working journey inspectable.",
  ], { size: 8.5, gap: 3 });
  quotePanel(
    doc,
    "EVALUATION PROOF",
    "The strongest evidence is not a promise about what CareerPilot could become; it is the connected journey a judge can use today.",
    { height: 70, font: "Body-BoldItalic", size: 9.5, fill: COLOR.secondary, stroke: COLOR.border },
  );
}

function section11(doc) {
  sectionStart(doc, 11, "Why CareerPilot Matters");
  paragraph(
    doc,
    "CareerPilot responds to a practical national challenge: helping educated young people become employable through better information, focused learning, and credible evidence. It supports students who do not know where to begin and gives them a way to understand their profile from an employer's perspective.",
  );
  quotePanel(
    doc,
    "CLOSING STATEMENT",
    "CareerPilot AI helps every student understand the gap between their current profile and the job they want, then gives them a practical path to close that gap with real evidence.",
    { height: 88, size: 11 },
  );

  paragraph(doc, "Post-hackathon roadmap in three phases", { bold: true, after: 10 });
  titledRows(doc, [
    {
      title: "Phase 1 — Depth",
      body: "Expand role coverage and company research, deepen interview question banks, and open recruiter audit to more markets.",
    },
    {
      title: "Phase 2 — Reach",
      body: "University and bootcamp partnerships for cohort-based employability tracking, with mentor dashboards for institutions.",
    },
    {
      title: "Phase 3 — Proof at scale",
      body: "Longitudinal outcome tracking: correlate roadmap completion with interview pass rates and offers, turning CareerPilot's promise into measured results.",
    },
  ]);

  doc.y += 6;
  ensureRoom(doc, 84);
  const top = doc.y;
  panel(doc, MARGIN, top, CONTENT_WIDTH, 64);
  tracking(doc, "LINKS", MARGIN + 14, top + 10, { size: 7 });
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLOR.ink)
    .text("Live demo", MARGIN + 14, top + 26, { lineBreak: false });
  doc
    .font("Body")
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text(LIVE_URL, MARGIN + 110, top + 26, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLOR.ink)
    .text("Source code", MARGIN + 14, top + 42, { lineBreak: false });
  doc
    .font("Body")
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text(REPO_URL, MARGIN + 110, top + 42, { lineBreak: false });
  doc.y = top + 76;

  doc.y += 16;
  tracking(
    doc,
    "SUPPORTING ATTACHMENT  |  CAREERPILOT AI  |  AI FOR PAKISTAN'S FUTURE",
    MARGIN,
    doc.y,
    {
      size: 7.5,
      color: COLOR.primary,
      align: "center",
    },
  );
}

/* ---------------------------------------------------------- full guide */

function fullSection4(doc) {
  sectionStart(doc, 4, "Onboarding and Career Profile");
  paragraph(
    doc,
    "CareerPilot begins by building a structured profile instead of asking the student to start with a generic chatbot question. The onboarding flow is a guided, nine-step setup that captures the learner's starting point, constraints, evidence, and target direction.",
  );
  titledRows(doc, [
    {
      title: "About You",
      body: "Name, current status, and the learner's present situation establish the context used across the workspace.",
    },
    {
      title: "Education",
      body: "Education level, degree, university, academic year, and graduation timing help the system understand the learner's stage.",
    },
    {
      title: "Experience",
      body: "The student records academic work, personal projects, freelance work, internships, professional work, and open-source contributions.",
    },
    {
      title: "Projects",
      body: "Each project can include a name, description, technologies, project type, and public URL. This becomes evidence that later modules can inspect.",
    },
    {
      title: "Skills",
      body: "Students select skills from the catalog, add custom skills, and describe confidence as beginner, comfortable, or strong.",
    },
    {
      title: "Career Direction",
      body: "Learning history, career clarity, certifications, and target role help separate an uncertain learner from someone ready for focused progression.",
    },
    {
      title: "Situation and Constraints",
      body: "The student identifies the biggest blocker, how well education prepared them, and the weekly time available for learning.",
    },
  ]);
  quotePanel(
    doc,
    "WHY THIS MATTERS",
    "The profile is the shared context behind diagnosis, market research, roadmap generation, resume matching, mentor guidance, and recruiter feedback.",
    { height: 72 },
  );
}

function fullSection5(doc) {
  sectionStart(doc, 5, "Dashboard and Career State");
  paragraph(
    doc,
    "The dashboard is the student's career command center. It brings readiness signals, the next action, roadmap status, applications, skills, market context, and mentor access into one view. It is designed to answer one practical question: what should I do next?",
  );
  table(
    doc,
    ["Dashboard area", "Purpose"],
    [
      ["Readiness cards", "Show career, resume, interview, and evidence signals when the student has completed the relevant analysis."],
      ["Career diagnosis", "Surfaces career stage, the main blocker, and the next best action."],
      ["Recommended roadmap", "Shows current learning stage, progress, and upcoming work."],
      ["Applications", "Tracks companies, roles, application status, interview dates, notes, and outcomes."],
      ["Top skills", "Keeps the student's recorded skill inventory visible and connected to resume evidence."],
      ["Market Reality", "Links the student's target role to employer expectations and demand signals."],
      ["Today's Plan", "Provides a focused daily action rather than an open-ended list of courses."],
      ["AI Resume Review", "Shows whether the resume has been analyzed and directs the student to the next improvement."],
    ],
    [125, CONTENT_WIDTH - 125],
  );
  paragraph(
    doc,
    "The dashboard reads from a single career state assembled on the server. That state combines profile, goal, skills, projects, resume analysis, diagnosis, readiness, roadmap progress, and target context. This prevents each page from giving advice from a different version of the student.",
  );
}

function fullSection6(doc) {
  sectionStart(doc, 6, "Career Diagnosis and Readiness");
  paragraph(
    doc,
    "Diagnosis is the product's central reasoning feature. It audits the student's profile against a selected role and company, then explains what is missing, why the gap matters, and what evidence should be produced next.",
  );
  paragraph(
    doc,
    "The diagnosis wizard has three explicit decisions: select the target employer, select the target position, and launch the rejection diagnosis. A custom company can be entered when the employer is not in the featured list. The system can also match a company truth profile to known employer expectations.",
    { after: 12 },
  );
  titledRows(doc, [
    {
      title: "Readiness score and breakdown",
      body: "The system stores an overall readiness value, career stage, and a breakdown of the factors that influence the student's current position.",
    },
    {
      title: "Strengths",
      body: "The report records genuine strengths found in the student's saved profile and evidence. The diagnostic instructions explicitly avoid inventing strengths.",
    },
    {
      title: "Blockers and rejection risks",
      body: "Each blocker includes the problem, supporting evidence, why it matters from a hiring perspective, and a fix that the student can act on.",
    },
    {
      title: "Priorities",
      body: "The report ranks the most important work and connects each priority to the evidence the student should produce.",
    },
    {
      title: "Next best action",
      body: "The student receives one immediate action with a reason and a definition of the proof that would make the action credible.",
    },
    {
      title: "Recovery sequence",
      body: "The result is ordered into now, next, and after stages so the student can work through a realistic progression.",
    },
  ]);
  quotePanel(
    doc,
    "DIAGNOSTIC PRINCIPLE",
    "A listed skill is a claim. A deployed project, measurable outcome, or explained technical decision is evidence.",
    { height: 72, fill: COLOR.ink, stroke: COLOR.ink, labelColor: COLOR.accent, textColor: COLOR.white },
  );
}

function fullSection7(doc) {
  sectionStart(doc, 7, "Market Reality and Future Tech");
  paragraph(
    doc,
    "Market Reality gives the student a reference point outside their own assumptions. It connects the target role to employer expectations, demand signals, salary context, skill gaps, and future technology trends. The page supports global research and optional Pakistan-focused context.",
  );
  stepGrid(doc, [
    { title: "Role signal", body: "Identify the skills, responsibilities, and proof expected for the selected role." },
    { title: "Company signal", body: "Use the target company and researched employer context to make the guidance more specific." },
    { title: "Local lens", body: "Review Pakistan-focused opportunities and salary context alongside remote and global paths." },
    { title: "Demand signal", body: "Separate established skills from high-growth areas and technologies that deserve monitoring." },
    { title: "Source layer", body: "Show research sources and summaries so the student can inspect where market claims came from." },
    { title: "Action layer", body: "Save a technology to a learning track or add a market-relevant skill to the roadmap." },
  ]);
  paragraph(
    doc,
    "Future Tech is a guided research experience rather than a list of buzzwords. Each technology can be explored through four questions: what it is, why it matters, whether the student should learn it, and how to learn it. The detail view can include prerequisites, use cases, career relevance, confidence, a learning path, a first project, sources, and personal tracking status.",
  );
}

function fullSection8(doc) {
  sectionStart(doc, 8, "Roadmap and Daily Execution");
  paragraph(
    doc,
    "The roadmap converts diagnosis into a sequence of learning stages. It is personalized from the student's profile, target role, evidence, available weekly time, and market context. The product treats learning as work that should produce visible proof.",
  );
  titledRows(doc, [
    {
      title: "Learning stage",
      body: "Each stage has a title, explanation, expected outcome, and practical context so the student understands why it exists.",
    },
    {
      title: "Daily task",
      body: "A roadmap day can include an explanation, a concrete task, a project direction, and a definition of done.",
    },
    {
      title: "Skill and evidence link",
      body: "The work is connected to the skill gap and the evidence the student needs for the target role.",
    },
    {
      title: "Completion tracking",
      body: "Students can mark practical work complete. Progress remains available after navigation and refresh because it is persisted.",
    },
    {
      title: "Assessment checkpoint",
      body: "Role-specific MCQs test understanding and return explanations instead of only showing a score.",
    },
    {
      title: "Certificate",
      body: "When the learning path is complete, the product can display a CareerPilot completion certificate for the selected target role.",
    },
  ]);
  paragraph(
    doc,
    "This design keeps CareerPilot focused on a small number of meaningful actions. The student does not only consume recommendations. The student completes work, records progress, and builds a portfolio trail.",
  );
}

function fullSection9(doc) {
  sectionStart(doc, 9, "Flight Plan and Job Readiness");
  paragraph(
    doc,
    "Flight Plan is the job-description readiness workflow. It translates a specific vacancy into a practical comparison between what the role asks for and what the student's saved profile can prove.",
  );
  table(
    doc,
    ["Flight Plan stage", "What the student receives"],
    [
      ["Target role selection", "A selected or entered role becomes the assessment target."],
      ["Job description input", "The system receives the role requirements that matter for this application."],
      ["Skill mirror", "Required skills are compared with the student's recorded skills and evidence."],
      ["Rejection truth", "The product explains the most likely reasons the application could fail screening."],
      ["Market truth note", "The student sees how market expectations affect the readiness judgment."],
      ["Fit verdict", "The result summarizes current fit and the gap that must be closed."],
      ["Action plan", "The student gets practical next steps instead of a generic fit percentage."],
    ],
    [125, CONTENT_WIDTH - 125],
  );
  quotePanel(
    doc,
    "PRODUCT VALUE",
    "Flight Plan turns a job description into a preparation plan before the student spends time applying.",
    { height: 68 },
  );
}

function fullSection10(doc) {
  sectionStart(doc, 10, "Resume Intelligence and ATS");
  paragraph(
    doc,
    "Resume Intelligence is a complete upload, parsing, scoring, and positioning workflow. Students can upload a PDF, DOCX, or TXT resume up to 5 MB. The interface supports file selection and drag-and-drop, then stores the active file and latest analysis.",
  );
  table(
    doc,
    ["Resume output", "What it explains"],
    [
      ["ATS Score", "Keyword and format fit based on structural checks and target-role alignment."],
      ["Impact Score", "Use of action verbs, measurable outcomes, and stronger accomplishment framing."],
      ["Role Match", "Compatibility between the resume and the student's target role."],
      ["Executive Summary", "A recruiter-style summary of the current presentation."],
      ["Competitive Strengths", "The strongest signals already present in the resume."],
      ["ATS Red Flags and Gaps", "Missing details, weak phrasing, structure problems, or evidence gaps."],
      ["Positioning Rewrites", "High-impact recommendations with an explanation of why each change matters."],
      ["Extracted Skills", "Technical skills detected from the resume text."],
      ["Market Target Compatibility", "Role matches compared with researched industry roles."],
    ],
    [145, CONTENT_WIDTH - 145],
  );
  paragraph(
    doc,
    "The analysis is grounded in the student's saved career goal and is synchronized back into the shared career state. Resume evidence can therefore influence diagnosis, readiness, recruiter audit, mentor context, and dashboard scores.",
  );
  quotePanel(
    doc,
    "RESUME POLICY",
    "CareerPilot treats a resume as evidence that must support the target role, not as a document that only needs attractive formatting.",
    { height: 70, fill: COLOR.secondary, stroke: COLOR.border },
  );
}

function fullSection11(doc) {
  sectionStart(doc, 11, "Interview Preparation and Job Mirror");
  paragraph(
    doc,
    "Interview Prep turns the selected role into a focused practice plan. It gives the student a role-specific interview intelligence view instead of a generic list of questions.",
  );
  titledRows(doc, [
    {
      title: "Answer Lab",
      body: "Students practice responses and refine how they explain decisions, projects, trade-offs, and outcomes.",
    },
    {
      title: "Evidence to bring",
      body: "The product identifies the projects, metrics, links, and examples that should support the student's claims in an interview.",
    },
    {
      title: "Expected interview stages",
      body: "The student can prepare for technical screening, project discussion, behavioral questions, and company-specific evaluation.",
    },
    {
      title: "Job Mirror",
      body: "The role is reflected back as an employer expectation model, showing what the student should know and what proof would make the claim believable.",
    },
  ]);
  paragraph(
    doc,
    "The value of this module is alignment. Interview practice, resume positioning, roadmap work, and recruiter feedback all point toward the same target role and evidence base.",
  );
}

function fullSection12(doc) {
  sectionStart(doc, 12, "Recruiter Audit");
  paragraph(
    doc,
    "Recruiter Audit simulates a hiring review of the student's profile. It is built around the question a recruiter or technical reviewer would ask: is there enough credible evidence to move this candidate to the next stage?",
  );
  titledRows(doc, [
    {
      title: "Candidate snapshot",
      body: "The audit uses the target role, target company, profile, skills, projects, resume analysis, diagnosis, and readiness context.",
    },
    {
      title: "Recruiter perspective",
      body: "The report identifies red flags, missing production proof, unclear positioning, and risks that may prevent an interview invitation.",
    },
    {
      title: "Evidence review",
      body: "Projects and resume claims are inspected as proof. Public URLs and measurable outcomes carry more weight than unverified lists of tools.",
    },
    {
      title: "Persistent recruiter session",
      body: "The recruiter conversation is stored so the student can return to the same audit context and continue improving the profile.",
    },
    {
      title: "Pipeline context",
      body: "The interface presents the review as a hiring pipeline with clear movement from profile audit to interview readiness.",
    },
  ]);
  quotePanel(
    doc,
    "RECRUITER TEST",
    "If a student says they know a technology, the audit asks what they built, deployed, measured, and can explain.",
    { height: 70, fill: COLOR.ink, stroke: COLOR.ink, labelColor: COLOR.accent, textColor: COLOR.white },
  );
}

function fullSection13(doc) {
  sectionStart(doc, 13, "AI Mentor and Progress System");
  paragraph(
    doc,
    "The AI Mentor is context-aware. It does not start every conversation from zero. The server builds a career context from the student's profile, goals, skills, projects, resume analysis, diagnosis, readiness, and roadmap progress before generating a response.",
  );
  bullets(doc, [
    "Suggested questions help students start with common career decisions.",
    "Career insights summarize the current state and expose the next useful question.",
    "Recommended actions connect mentor advice to roadmap, resume, diagnosis, or interview work.",
    "Chat history is stored so the student can return to an ongoing coaching conversation.",
    "The mentor is designed for direct, specific guidance rather than generic encouragement.",
  ]);
  paragraph(
    doc,
    "The progress system completes the loop. Notifications can surface roadmap progress, assessment events, and career nudges. The dashboard summarizes the same progress, and the certificate provides a visible completion outcome when the path is finished.",
  );
  paragraph(
    doc,
    "Profile remains editable after onboarding. Students can update basic information, knowledge, skills, avatar, projects, and account details as their evidence improves.",
  );
}

function fullSection14(doc) {
  sectionStart(doc, 14, "Technical Architecture and Security");
  paragraph(
    doc,
    "CareerPilot uses a React and TypeScript client with TanStack Router and TanStack Query. Reusable UI components, server functions, loading states, error handling, and cached queries keep the product maintainable as the feature set grows.",
  );
  table(
    doc,
    ["Layer", "Implementation"],
    [
      ["Client", "React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, Motion, and reusable UI components."],
      ["Server functions", "Authenticated functions validate input, load user-scoped state, call AI or research providers, and persist results."],
      ["Database", "Supabase PostgreSQL stores profiles, goals, skills, projects, resumes, diagnoses, roadmaps, assessments, applications, notifications, and recruiter sessions."],
      ["Storage", "Supabase Storage supports user files such as resumes and avatars with user-scoped access."],
      ["AI providers", "Groq, Gemini, and OpenRouter can be selected through server-side configuration with fallback handling."],
      ["Research", "Tavily-backed research supports market and technology intelligence with cached results and source links."],
      ["Deployment", "Vercel provides the serverless deployment target for the working prototype."],
    ],
    [125, CONTENT_WIDTH - 125],
  );
  titledRows(doc, [
    {
      title: "Credential boundary",
      body: "Privileged AI and research keys remain on the server. The browser receives only the data needed for the authenticated experience.",
    },
    {
      title: "User isolation",
      body: "Row Level Security and user-scoped queries protect personal profiles, resumes, projects, progress, and conversations.",
    },
    {
      title: "Validation and fallback",
      body: "Server validation protects assessment and profile operations. Provider fallback and cached results keep core workflows useful when an external service is unavailable.",
    },
  ]);
}

function fullSection15(doc) {
  sectionStart(doc, 15, "Data Model and Persistence");
  paragraph(
    doc,
    "The product is persistent by design. Important actions create or update records instead of living only in browser state. This is what makes the experience resume-able after refresh and allows multiple modules to share the same career context.",
  );
  table(
    doc,
    ["Data area", "Stored information"],
    [
      ["Identity and profile", "Authentication identity, name, education, status, university, goals, weekly time, and career context."],
      ["Skills", "Skill catalog selections, custom skills, confidence, and evidence strength."],
      ["Projects", "Project name, description, technologies, URL, project type, and evidence metadata."],
      ["Career target", "Target role, target industry, target job, and company context."],
      ["Diagnosis", "Readiness, stage, strengths, blockers, priorities, next best action, sequence, and market benchmark."],
      ["Resume", "Uploaded file metadata, parsed analysis, scores, skills, weaknesses, recommendations, and role matches."],
      ["Roadmap", "Generated stages, days, task content, completion, assessments, attempts, and certificate status."],
      ["Engagement", "Applications, notifications, mentor chat messages, recruiter sessions, and future-tech tracking."],
    ],
    [125, CONTENT_WIDTH - 125],
  );
  paragraph(
    doc,
    "The database migration history shows the product evolving through added diagnostic intakes, market reality caching, user projects, technology tracking, roadmap versioning, resume storage fixes, and recruiter sessions. That history reflects an iterative prototype rather than a static mockup.",
  );
}

function fullSection16(doc) {
  sectionStart(doc, 16, "Demonstration and Evaluation Guide");
  paragraph(
    doc,
    "A strong demonstration should show the relationship between modules, not only open isolated pages. The following sequence gives a judge the clearest view of the product's value.",
  );
  const steps = [
    ["Profile", "Open or create a student account and complete the Know Me onboarding flow."],
    ["Target", "Select a target role and company, or enter a custom company."],
    ["Diagnosis", "Run the company-specific diagnosis and review blockers, priorities, and next action."],
    ["Market", "Open Market Reality to inspect role expectations, demand, local context, and sources."],
    ["Resume", "Upload a PDF, DOCX, or TXT resume and review ATS, impact, and role-match scores."],
    ["Plan", "Generate the personalized roadmap and open the first practical day."],
    ["Proof", "Complete a task, take the MCQ, and inspect the explanation and saved progress."],
    ["Interview", "Open Job Mirror and practice a role-specific answer with the evidence to bring."],
    ["Recruiter", "Run Recruiter Audit to see how the same evidence looks from an employer's perspective."],
    ["Mentor", "Ask the AI Mentor for the next action and show that it remembers the student's context."],
  ];
  steps.forEach(([title, body], index) => {
    ensureRoom(doc, 39);
    const y = doc.y;
    doc.save();
    doc.fillColor(COLOR.cream).circle(MARGIN + 12, y + 10, 10).fill();
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLOR.primary).text(String(index + 1), MARGIN + 9, y + 5, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLOR.ink).text(title, MARGIN + 32, y + 2, { lineBreak: false });
    doc.font("Body").fontSize(8.8).fillColor(COLOR.muted).text(body, MARGIN + 32, y + 16, { width: CONTENT_WIDTH - 32, lineGap: 2 });
    doc.y = y + 34;
  });
  quotePanel(
    doc,
    "WHAT THE JUDGE SHOULD REMEMBER",
    "CareerPilot carries one target and one evidence base through the entire product journey. Every module answers the question raised by the previous module.",
    { height: 76, fill: COLOR.secondary, stroke: COLOR.border },
  );
}

function fullSection17(doc) {
  sectionStart(doc, 17, "Impact, Feasibility, and Next Steps");
  paragraph(
    doc,
    "CareerPilot addresses a practical challenge for Pakistan and other emerging markets: educated people often need clearer information, stronger proof, and more structured support before they can compete for work. The product turns that challenge into a measurable personal workflow.",
  );
  titledRows(doc, [
    {
      title: "Immediate value",
      body: "Students can see the distance between their current evidence and the expectations of a target role instead of relying on guesswork.",
    },
    {
      title: "Accessible guidance",
      body: "The AI Mentor, diagnosis, and roadmap make context-aware guidance available without requiring every student to find a private mentor.",
    },
    {
      title: "Low-cost foundation",
      body: "Serverless deployment, cached research, provider fallback, and Supabase persistence create a practical foundation for a hackathon-scale product.",
    },
    {
      title: "Institutional potential",
      body: "Universities and training programs could use the same structure to track learner readiness, evidence, activity, and outcomes.",
    },
    {
      title: "Next product steps",
      body: "Expand role and company coverage, improve market source quality, add deeper interview banks, support institutional cohorts, and measure the relationship between roadmap completion and job outcomes.",
    },
  ]);
  quotePanel(
    doc,
    "PROJECT SUMMARY",
    "CareerPilot AI connects personal context, market reality, practical learning, and employer proof in one deployed career readiness workspace.",
    { height: 78, size: 11, fill: COLOR.ink, stroke: COLOR.ink, labelColor: COLOR.accent, textColor: COLOR.white, font: "Helvetica-Bold" },
  );
  doc.y += 8;
  ensureRoom(doc, 84);
  const top = doc.y;
  panel(doc, MARGIN, top, CONTENT_WIDTH, 64);
  tracking(doc, "PROJECT LINKS", MARGIN + 14, top + 10, { size: 7 });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLOR.ink).text("Live demo", MARGIN + 14, top + 26, { lineBreak: false });
  doc.font("Body").fontSize(9.5).fillColor(COLOR.muted).text(LIVE_URL, MARGIN + 110, top + 26, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLOR.ink).text("Source code", MARGIN + 14, top + 42, { lineBreak: false });
  doc.font("Body").fontSize(9.5).fillColor(COLOR.muted).text(REPO_URL, MARGIN + 110, top + 42, { lineBreak: false });
  doc.y = top + 76;
}

/* ------------------------------------------------------------------ main */

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true });
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: TOP_Y, bottom: 72, left: MARGIN, right: MARGIN },
    info: {
      Title: "CareerPilot AI — Full Product Documentation",
      Author: "CareerPilot AI Team",
      Subject: "Alibaba Cloud AI Hackathon Pakistan 2026 — full product, feature, and technical documentation",
      Keywords:
        "CareerPilot AI, product documentation, career readiness, hackathon, Alibaba Cloud, Pakistan, AI mentor, roadmap, recruiter audit, market reality, resume intelligence, diagnosis, architecture",
    },
  });
  registerDocumentFonts(doc);

  const stream = fs.createWriteStream(OUT_FILE);
  doc.pipe(stream);

  drawCover(doc);
  drawTableOfContents(doc);
  section1(doc);
  section2(doc);
  section3(doc);
  fullSection4(doc);
  fullSection5(doc);
  fullSection6(doc);
  fullSection7(doc);
  fullSection8(doc);
  fullSection9(doc);
  fullSection10(doc);
  fullSection11(doc);
  fullSection12(doc);
  fullSection13(doc);
  fullSection14(doc);
  fullSection15(doc);
  fullSection16(doc);
  fullSection17(doc);

  // Running footers are stamped after all content so they never interfere
  // with in-flow text layout. The cover (page index 0) stays clean.
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start + 1; i < range.start + total; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1);
  }
  doc.flushPages();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.end();
  });
  console.log(`[ok] wrote ${path.relative(ROOT, OUT_FILE)} (${total} pages)`);

  await fs.promises.copyFile(OUT_FILE, ROOT_FILE);
  console.log(`[ok] copied to ${path.relative(ROOT, ROOT_FILE)}`);
  await fs.promises.copyFile(OUT_FILE, PUBLIC_FILE);
  console.log(`[ok] copied to ${path.relative(ROOT, PUBLIC_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
