import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-rule bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <NewsletterSignup />

          <div className="grid grid-cols-2 gap-8 md:justify-items-end">
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
          </div>
        </div>

        <div className="mt-16 flex items-center gap-3 border-t border-rule pt-6">
          <BrandMark size={22} className="opacity-60" />
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            Mello Studio — original work, made by hand
          </p>
        </div>
      </div>
    </footer>
  );
}
