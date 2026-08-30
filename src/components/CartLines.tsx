"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setQuantity } from "@/lib/cart/actions";
import { formatCents } from "@/lib/money";
import type { CartLine } from "@/lib/cart";

function QuantityStepper({ line }: { line: CartLine }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: number) {
    startTransition(async () => {
      await setQuantity({ itemId: line.id, quantity: next });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center border border-rule">
      <button
        onClick={() => change(line.quantity - 1)}
        disabled={pending}
        aria-label="Reduce quantity"
        className="px-2.5 py-1 font-data text-sm text-muted hover:text-bone disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-8 px-1 text-center font-data text-xs">{line.quantity}</span>
      <button
        onClick={() => change(line.quantity + 1)}
        disabled={pending || line.quantity >= 25}
        aria-label="Increase quantity"
        className="px-2.5 py-1 font-data text-sm text-muted hover:text-bone disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

export function CartLines({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-4 py-5">
          <Link
            href={`/products/${line.productSlug}`}
            className="relative block h-24 w-20 shrink-0 overflow-hidden bg-surface"
          >
            {line.imageUrl && (
              <Image
                src={line.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="eyebrow">{line.typeName}</p>
            <Link
              href={`/products/${line.productSlug}`}
              className="mt-1 truncate text-sm font-medium hover:text-muted"
            >
              {line.productName}
            </Link>
            {line.variantLabel && (
              <p className="mt-0.5 font-data text-[0.625rem] text-muted">
                {line.variantLabel}
              </p>
            )}

            {line.unavailable ? (
              <p className="mt-2 font-data text-[0.625rem] uppercase tracking-[0.14em] text-iris">
                {line.unavailable}
              </p>
            ) : (
              <div className="mt-auto pt-3">
                <QuantityStepper line={line} />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end justify-between">
            <p className="font-data text-sm">
              {line.unavailable ? "—" : formatCents(line.lineTotalCents)}
            </p>
            <button
              onClick={() =>
                startTransition(async () => {
                  await setQuantity({ itemId: line.id, quantity: 0 });
                  router.refresh();
                })
              }
              disabled={pending}
              className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
