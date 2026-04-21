"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { Mic, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "@/components/message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function pickExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function toUIMessage(m: StoredMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  };
}

function extractText(m: UIMessage): string {
  return m.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function Chat({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: StoredMessage[];
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { sessionId },
      }),
    [sessionId],
  );

  const initialUIMessages = useMemo(
    () => initialMessages.map(toUIMessage),
    [initialMessages],
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    id: sessionId,
    transport,
    messages: initialUIMessages,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function transcribe(blob: Blob) {
    setIsTranscribing(true);
    try {
      const ext = pickExtension(blob.type);
      const form = new FormData();
      form.append("audio", blob, `recording.${ext}`);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(err?.error || `Transcription failed (${res.status})`);
      }
      const data = (await res.json()) as { text: string };
      const text = (data.text || "").trim();
      if (text) {
        setInput((prev) => (prev ? `${prev} ${text}` : text));
      }
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        if (blob.size > 0) await transcribe(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setVoiceError("Microphone access was denied or is unavailable.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            Say hello to get started.
          </div>
        ) : null}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role as "user" | "assistant"}>
            {extractText(m)}
          </MessageBubble>
        ))}

        {status === "submitted" ? (
          <MessageBubble role="assistant">
            <span className="text-muted-foreground">Thinking…</span>
          </MessageBubble>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 text-destructive px-3 py-2 text-sm">
            <div className="font-medium">
              Something went wrong while sending your message.
            </div>
            <div className="mt-0.5 text-xs opacity-90">{error.message}</div>
            <button
              type="button"
              onClick={clearError}
              className="mt-1 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t bg-background p-4 space-y-3">
        {voiceError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 text-destructive px-3 py-2 text-xs">
            {voiceError}
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Recording… click stop when done."
                : isTranscribing
                  ? "Transcribing…"
                  : "Type your message… (Shift+Enter for newline)"
            }
            rows={2}
            className="resize-none"
            disabled={busy || isRecording || isTranscribing}
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={busy || isTranscribing}
            aria-label={isRecording ? "Stop recording" : "Record voice message"}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? <Square /> : <Mic />}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={busy || isRecording || isTranscribing || !input.trim()}
          >
            Send
          </Button>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {isRecording
              ? "Recording…"
              : isTranscribing
                ? "Transcribing…"
                : status === "streaming"
                  ? "Assistant is responding…"
                  : status === "submitted"
                    ? "Sending…"
                    : "Ready"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/session/${sessionId}/end`)}
            disabled={busy || isRecording || isTranscribing}
          >
            End session
          </Button>
        </div>
      </div>
    </div>
  );
}
