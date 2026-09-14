import { describe, it, expect } from "vitest";
import { parseJsonObject, clampScore, stringList } from "./ai.server";
import { matchKeywords, extractJobKeywords } from "./resume.server";

describe("parseJsonObject", () => {
  it("parses clean JSON", () => {
    const result = parseJsonObject<{ foo: string }>('{"foo": "bar"}');
    expect(result).toEqual({ foo: "bar" });
  });

  it("strips markdown code fences", () => {
    const result = parseJsonObject<{ foo: string }>('```json\n{"foo": "bar"}\n```');
    expect(result).toEqual({ foo: "bar" });
  });

  it("extracts JSON from mixed prose", () => {
    const result = parseJsonObject<{ foo: string }>('Here is the result: {"foo": "bar"} and that is it.');
    expect(result).toEqual({ foo: "bar" });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJsonObject("not json")).toThrow("The AI response couldn't be read");
  });
});

describe("clampScore", () => {
  it("clamps to 0-100 range", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(50)).toBe(50);
  });

  it("handles non-numeric input", () => {
    expect(clampScore("not a number")).toBe(0);
    expect(clampScore(null)).toBe(0);
    expect(clampScore(undefined)).toBe(0);
  });

  it("rounds decimal values", () => {
    expect(clampScore(67.8)).toBe(68);
    expect(clampScore(67.2)).toBe(67);
  });
});

describe("stringList", () => {
  it("filters and truncates string arrays", () => {
    const result = stringList(["a", "b", "", "c", 123, "d", "e", "f", "g", "h", "i"], 5);
    expect(result).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("returns empty array for non-array input", () => {
    expect(stringList("not an array")).toEqual([]);
    expect(stringList(null)).toEqual([]);
  });
});

describe("extractJobKeywords", () => {
  const jobDesc = `
We are looking for a Senior TypeScript Developer with React and Node.js experience.
Required: PostgreSQL, Docker, AWS, Kubernetes, GraphQL, REST API.
Nice to have: Redis, Kafka, Terraform, CI/CD pipelines.
  `;

  it("extracts known tech vocabulary", () => {
    const keywords = extractJobKeywords(jobDesc);
    expect(keywords).toContain("typescript");
    expect(keywords).toContain("react");
    expect(keywords).toContain("node.js");
    expect(keywords).toContain("postgresql");
    expect(keywords).toContain("docker");
    expect(keywords).toContain("aws");
    expect(keywords).toContain("kubernetes");
    expect(keywords).toContain("graphql");
    expect(keywords).toContain("rest api");
  });

  it("limits results to max parameter", () => {
    const keywords = extractJobKeywords(jobDesc, 5);
    expect(keywords.length).toBeLessThanOrEqual(5);
  });
});

describe("matchKeywords", () => {
  const resumeText = `
Built REST API with Node.js and PostgreSQL
Developed React frontend with TypeScript
Used Docker for containerization
Deployed to AWS with Kubernetes
  `;

  it("identifies keyword hits", () => {
    const { hits } = matchKeywords(resumeText, ["node.js", "postgresql", "react", "typescript", "docker", "aws", "kubernetes"]);
    expect(hits).toContain("node.js");
    expect(hits).toContain("postgresql");
    expect(hits).toContain("react");
    expect(hits).toContain("typescript");
    expect(hits).toContain("docker");
    expect(hits).toContain("aws");
    expect(hits).toContain("kubernetes");
  });

  it("identifies missing keywords", () => {
    const { missing } = matchKeywords(resumeText, ["node.js", "postgresql", "react", "typescript", "docker", "aws", "kubernetes", "graphql", "redis"]);
    expect(missing).toContain("graphql");
    expect(missing).toContain("redis");
  });

  it("uses word boundaries to avoid partial matches", () => {
    const { hits, missing } = matchKeywords("I know go language", ["go", "golang"]);
    expect(hits).toContain("go");
    expect(missing).toContain("golang");
  });
});