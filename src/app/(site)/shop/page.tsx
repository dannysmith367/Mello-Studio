import { CatalogPage } from "@/components/CatalogPage";
import { getPageIntros } from "@/lib/settings";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ type }, intros] = await Promise.all([searchParams, getPageIntros()]);

  return (
    <CatalogPage
      eyebrow="Everything"
      title="Shop"
      intro={intros.shop}
      productTypeSlug={type}
      showFormatRow
    />
  );
}
