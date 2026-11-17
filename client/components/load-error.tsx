import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoadError({ subject }: { subject: string }) {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertDescription>
        Could not load {subject}. Refresh the page in a moment.
      </AlertDescription>
    </Alert>
  );
}
