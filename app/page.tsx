import { IntakeForm } from "@/components/intake-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-1">
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-primary">
            Lightpier
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Discovery Session
          </h1>
        </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Start a discovery session</CardTitle>
          <CardDescription className="space-y-2">
            <span className="block">
              A short conversation with an AI assistant to map the requirements
              for a custom CRM built specifically for your business. Expect
              10&ndash;15 minutes. At the end, you&apos;ll get a structured
              summary of what was captured.
            </span>
            <span className="block text-muted-foreground italic">
              This will be used by our team to formulate better questions before
              our meeting. Don&apos;t worry about what you put in here &mdash;
              none of this is set in stone. We&apos;re just trying to gather
              candid information.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeForm />
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
