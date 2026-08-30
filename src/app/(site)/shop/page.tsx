import { CatalogPage } from "@/components/CatalogPage";

export const metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <CatalogPage
      eyebrow="Everything"
      title="Shop"
      intro="Every piece currently available, on cloth and paper."
    />
  );
}
