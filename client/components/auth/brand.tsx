import Image from "next/image";

import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image src="/logo.png" alt="" width={64} height={64} priority />
      <span className="font-heading text-4xl font-semibold tracking-tight">
        {APP_NAME}
      </span>
    </div>
  );
}
