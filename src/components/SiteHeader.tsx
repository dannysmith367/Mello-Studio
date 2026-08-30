import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { getCartCount } from "@/lib/cart";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/apparel", label: "Apparel" },
  { href: "/prints", label: "Prints" },
  { href: "/collections", label: "Collections" },
  { href: "/commissions", label: "Commissions" },
  { href: "/about", label: "About" },
];

export async function SiteHeader() {
  const count = await getCartCount();

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Mello Studio, home">
          <BrandMark size={26} priority />
          <span className="font-display text-base font-medium tracking-[-0.01em] sm:text-lg">
            Mello Studio
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 font-data text-[0.6875rem] uppercase tracking-[0.14em]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted transition-colors hover:text-bone">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/cart"
          className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-bone"
        >
          Bag{count > 0 ? ` (${count})` : ""}
        </Link>
      </div>

      <div className="border-t border-rule md:hidden">
        <ul className="flex gap-6 overflow-x-auto px-5 py-2.5 font-data text-[0.6875rem] uppercase tracking-[0.14em]">
          {nav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link href={item.href} className="text-muted">{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
