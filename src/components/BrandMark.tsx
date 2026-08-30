import Image from "next/image";

/**
 * The logo: the brush M with its star. It carries no wordmark, so anywhere
 * the brand name needs reading it is set in type alongside.
 */
export function BrandMark({
  size = 28,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/mello-mark.png"
      alt=""
      aria-hidden="true"
      width={Math.round(size * (690 / 652))}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
