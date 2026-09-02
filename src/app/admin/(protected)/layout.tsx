import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { logout } from "../actions";
import { BrandMark } from "@/components/BrandMark";

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/artwork", label: "Artwork" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/product-types", label: "Product types" },
  { href: "/admin/printify", label: "Printify" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/inquiries", label: "Enquiries" },
  { href: "/admin/issues", label: "Issues" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The authorization check. Middleware only saw that a cookie existed.
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-void">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark size={22} />
            <span className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
              Studio admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
            >
              View site
            </Link>
            <form action={logout}>
              <button className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Admin sections" className="border-t border-rule">
          <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 py-2.5 font-data text-[0.6875rem] uppercase tracking-[0.14em] sm:px-8">
            {sections.map((section) => (
              <li key={section.href} className="shrink-0">
                <Link href={section.href} className="text-muted hover:text-bone">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <p className="border-t border-rule pt-5 font-data text-[0.6875rem] text-muted">
          Signed in as {user.email}
        </p>
      </footer>
    </div>
  );
}
