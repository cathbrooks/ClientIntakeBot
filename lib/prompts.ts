import "server-only";
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "prompts");

function read(relative: string): string {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

const role = read("system/role.md");
const methodology = read("system/methodology.md");
const outputExpectations = read("system/output-expectations.md");
const summaryExtract = read("summary/extract.md");

const industryCache = new Map<string, string>();

function loadIndustry(industry: string): string {
  const cached = industryCache.get(industry);
  if (cached !== undefined) return cached;
  const content = read(`industries/${industry}.md`);
  industryCache.set(industry, content);
  return content;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function buildSystemPrompt(opts: {
  industry: string;
  contactName: string;
  companyName: string;
}): string {
  const industry = loadIndustry(opts.industry);
  const header = `You are speaking with ${firstName(opts.contactName)} from ${opts.companyName}.`;

  return [header, role, methodology, outputExpectations, industry]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join("\n\n");
}

export function getSummaryPrompt(): string {
  return summaryExtract;
}

export function buildWelcomeMessage(opts: {
  contactName: string;
  companyName: string;
}): string {
  const name = firstName(opts.contactName);
  return `Hi ${name}, thanks for doing this — should take about 10–15 minutes. To kick things off, what software or tools does ${opts.companyName} currently use to run the business day-to-day?`;
}
