import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import { BrandMark } from "./BrandMark";
import { FacebookIcon, InstagramIcon, TiktokIcon, XIcon } from "./icons/SocialIcons";
import { getSocialLinks } from "@/lib/settings";

export async function SiteFooter() {
  const social = await getSocialLinks();
  const socialLinks = [
    { href: social.x, label: "X", Icon: XIcon },
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.tiktok, label: "TikTok", Icon: TiktokIcon },
  ].filter((link) => link.href !== "");

  return (
    <footer className="mt-8 border-t border-rule bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <NewsletterSignup />

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:justify-items-end">
            <div>
              <p className="eyebrow">Shop</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li><Link href="/shop" className="hover:text-bone">All work</Link></li>
                <li><Link href="/apparel" className="hover:text-bone">Apparel</Link></li>
                <li><Link href="/prints" className="hover:text-bone">Prints</Link></li>
                <li><Link href="/collections" className="hover:text-bone">Collections</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Studio</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li><Link href="/about" className="hover:text-bone">About Mello</Link></li>
                <li><Link href="/commissions" className="hover:text-bone">Commissions</Link></li>
                <li><Link href="/cart" className="hover:text-bone">Bag</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Policies</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li><Link href="/support" className="hover:text-bone">Order support</Link></li>
                <li><Link href="/shipping" className="hover:text-bone">Shipping</Link></li>
                <li><Link href="/returns" className="hover:text-bone">Returns</Link></li>
                <li><Link href="/privacy" className="hover:text-bone">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-bone">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-rule pt-6">
          <div className="flex items-center gap-3">
            <BrandMark size={22} className="opacity-60" />
            <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
              Mello Studio — original work, made by hand
            </p>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted transition-colors hover:text-bone"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
