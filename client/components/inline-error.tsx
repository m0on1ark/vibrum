export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;

  return <span className="text-sm text-destructive">{message}</span>;
}
