/**
 * lucide-react dropped brand/social logos years ago (trademark scope), so
 * these are hand-drawn in the same stroke style (24x24, round caps/joins)
 * to sit next to real lucide icons without looking out of place.
 */
type IconProps = { size?: number; className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function XIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function InstagramIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TiktokIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...base}>
      <path d="M15 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M15 3c0 2.5 1.5 4 4 4" />
    </svg>
  );
}
