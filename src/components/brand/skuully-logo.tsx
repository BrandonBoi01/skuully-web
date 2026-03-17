import Image from "next/image";
import Link from "next/link";

type SkuullyLogoVariant =
  | "long-white"
  | "white-icon"
  | "original-icon"
  | "original-white-name"
  | "original-original-name";

type LegacyProps = {
  size?: number;
  showText?: boolean;
};

type ModernProps = {
  href?: string | null;
  variant?: SkuullyLogoVariant;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  alt?: string;
};

export type SkuullyLogoProps = LegacyProps & ModernProps;

const variantMap: Record<SkuullyLogoVariant, string> = {
  "long-white": "/skuully-long-white-logo.svg",
  "white-icon": "/skuully-white-icon.svg",
  "original-icon": "/skuully-original-icon.svg",
  "original-white-name": "/skuully-originallogo-whitename.svg",
  "original-original-name": "/skuully-originallogo-originalname.svg",
};

function resolveVariant(
  variant?: SkuullyLogoVariant,
  showText?: boolean
): SkuullyLogoVariant {
  if (variant) return variant;
  return showText ? "original-white-name" : "white-icon";
}

function resolveDimensions(input: {
  variant: SkuullyLogoVariant;
  width?: number;
  height?: number;
  size?: number;
}) {
  const { variant, width, height, size } = input;

  if (width && height) {
    return { width, height };
  }

  if (size) {
    switch (variant) {
      case "white-icon":
      case "original-icon":
        return { width: size, height: size };

      case "long-white":
        return { width: Math.round(size * 4.4), height: size };

      case "original-white-name":
      case "original-original-name":
        return { width: Math.round(size * 4.1), height: size };

      default:
        return { width: Math.round(size * 4), height: size };
    }
  }

  switch (variant) {
    case "white-icon":
    case "original-icon":
      return { width: 32, height: 32 };

    case "long-white":
      return { width: 150, height: 34 };

    case "original-white-name":
    case "original-original-name":
      return { width: 148, height: 34 };

    default:
      return { width: 148, height: 34 };
  }
}

export function SkuullyLogo({
  href = "/",
  variant,
  width,
  height,
  size,
  showText,
  priority = false,
  className,
  alt = "Skuully",
}: SkuullyLogoProps) {
  const resolvedVariant = resolveVariant(variant, showText);
  const src = variantMap[resolvedVariant];
  const dimensions = resolveDimensions({
    variant: resolvedVariant,
    width,
    height,
    size,
  });

  const image = (
    <Image
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={className}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {image}
    </Link>
  );
}