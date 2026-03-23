import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SocialIconProps = {
  className?: string;
};

export function GoogleIcon({ className }: SocialIconProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} aria-hidden="true">
      <Image
        src="/Assets/google-icon-logo-svgrepo-com.svg"
        alt=""
        fill
        className="object-contain"
        sizes="20px"
      />
    </span>
  );
}

export function AppleIcon({ className }: SocialIconProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} aria-hidden="true">
      <Image
        src="/Assets/apple-black-logo-svgrepo-com.svg"
        alt=""
        fill
        className="object-contain dark:invert"
        sizes="20px"
      />
    </span>
  );
}