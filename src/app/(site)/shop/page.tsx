import { CatalogPage } from "@/components/CatalogPage";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  return (
    <CatalogPage
      eyebrow="Everything"
      title="Shop"
      intro="Every piece currently available, on cloth and paper."
      productTypeSlug={type}
      showFormatRow
    />
  );
}
