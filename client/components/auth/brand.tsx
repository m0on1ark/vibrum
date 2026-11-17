import Image from "next/image";

import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  lg: { logo: 64, text: "text-4xl", gap: "gap-3" },
  sm: { logo: 32, text: "text-xl", gap: "gap-2" },
} as const;

export function Brand({
  className,
  size = "lg",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  const { logo, text, gap } = SIZES[size];

  return (
    <div className={cn("flex items-center", gap, className)}>
      <Image src="/logo.png" alt="" width={logo} height={logo} priority />
      <span
        className={cn("font-heading font-semibold tracking-tight", text)}
      >
        {APP_NAME}
      </span>
    </div>
  );
}
