import "server-only";
import { supabase } from "./supabase";
import type { SummaryData } from "./summary-schema";

export type Session = {
  id: string;
  contact_name: string;
  company_name: string;
  email: string | null;
  industry: string;
  started_at: string;
  ended_at: string | null;
  summary: SummaryData | null;
};

export type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function createSession(input: {
  contactName: string;
  companyName: string;
  email: string | null;
  industry: string;
}): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      contact_name: input.contactName,
      company_name: input.companyName,
      email: input.email,
      industry: input.industry,
    })
    .select("*")
    .single();

  if (error) throw new Error(`createSession: ${error.message}`);
  return data as Session;
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getSession: ${error.message}`);
  return data as Session | null;
}

export async function listSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false });

  if (error) throw new Error(`listSessions: ${error.message}`);
  return (data ?? []) as Session[];
}

export async function listMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`listMessages: ${error.message}`);
  return (data ?? []) as Message[];
}

export async function insertMessage(input: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
  });
  if (error) throw new Error(`insertMessage: ${error.message}`);
}

export async function saveSummary(input: {
  sessionId: string;
  summary: SummaryData;
}): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({
      summary: input.summary,
      ended_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId);
  if (error) throw new Error(`saveSummary: ${error.message}`);
}
