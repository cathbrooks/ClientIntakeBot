import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY must be set");
}

export const anthropic = new Anthropic({ apiKey });

export const CHAT_MODEL = "claude-sonnet-4-6";
export const SUMMARY_MODEL = "claude-opus-4-7";
