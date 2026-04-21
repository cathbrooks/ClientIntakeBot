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
      <Card className="w-full max-w-md">
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
    </main>
  );
}
