"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  contactName: z.string().trim().min(1, "Required"),
  companyName: z.string().trim().min(1, "Required"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Invalid email",
    }),
});

type FieldErrors = Partial<Record<"contactName" | "companyName" | "email", string>>;

export function IntakeForm() {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const parsed = schema.safeParse({ contactName, companyName, email });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: parsed.data.contactName,
          companyName: parsed.data.companyName,
          email: parsed.data.email || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create session");
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/session/${id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="contactName">Your name</Label>
        <Input
          id="contactName"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          autoComplete="name"
          required
          disabled={submitting}
        />
        {errors.contactName ? (
          <p className="text-xs text-destructive">{errors.contactName}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">Company</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          autoComplete="organization"
          required
          disabled={submitting}
        />
        {errors.companyName ? (
          <p className="text-xs text-destructive">{errors.companyName}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={submitting}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email}</p>
        ) : null}
      </div>

      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Starting session…" : "Start session"}
      </Button>
    </form>
  );
}
