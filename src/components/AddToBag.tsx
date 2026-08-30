"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart/actions";
import { formatCents } from "@/lib/money";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceOverrideCents: number | null;
};

/**
 * Variant picker plus add-to-bag.
 *
 * Only ids leave the browser. Price is displayed here for the customer's
 * benefit but is re-resolved server-side, so a tampered value changes
 * nothing about what gets charged.
 */
export function AddToBag({
  productId,
  variants,
  basePriceCents,
}: {
  productId: string;
  variants: Variant[];
  basePriceCents: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const colors = [
    ...new Map(
      variants.filter((v) => v.color).map((v) => [v.color!, v.colorHex])
    ).entries(),
  ];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];

  const [color, setColor] = useState<string | null>(colors[0]?.[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);

  const selected =
    variants.find(
      (v) => (color ? v.color === color : true) && (size ? v.size === size : true)
    ) ?? (colors.length === 0 && sizes.length === 0 ? variants[0] : undefined);

  const price = selected?.priceOverrideCents ?? basePriceCents;

  function handleAdd() {
    if (!selected) return setError("That combination isn't available.");
    setError(null);

    startTransition(async () => {
      const result = await addToCart({
        productId,
        variantId: selected.id,
        quantity: 1,
      });

      if (result.error) return setError(result.error);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2500);
    });
  }

  return (
    <div>
      <p className="mt-3 font-data text-lg">{formatCents(price)}</p>

      {colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="eyebrow">Colour</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {colors.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                onClick={() => setColor(name)}
                aria-pressed={color === name}
                className={`flex items-center gap-2 border px-3 py-1.5 font-data text-xs transition-colors ${
                  color === name ? "border-bone text-bone" : "border-rule text-muted"
                }`}
              >
                {hex && (
                  <span
                    className="inline-block h-3 w-3 border border-rule"
                    style={{ backgroundColor: hex }}
                  />
                )}
                {name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset className="mt-6">
          <legend className="eyebrow">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const exists = variants.some(
                (v) => v.size === s && (color ? v.color === color : true)
              );
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!exists}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`border px-3 py-1.5 font-data text-xs transition-colors ${
                    size === s ? "border-bone text-bone" : "border-rule text-muted"
                  } ${!exists ? "cursor-not-allowed line-through opacity-40" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <button
        onClick={handleAdd}
        disabled={pending || !selected}
        className="btn-solid mt-9 w-full sm:w-auto"
      >
        {pending ? "Adding…" : added ? "Added to bag" : "Add to bag"}
      </button>

      {error && (
        <p role="alert" className="mt-3 font-data text-xs text-iris">
          {error}
        </p>
      )}
    </div>
  );
}
