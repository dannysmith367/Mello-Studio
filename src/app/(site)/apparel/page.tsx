import { CatalogPage } from "@/components/CatalogPage";

export const metadata = { title: "Apparel" };

export default function ApparelPage() {
  return (
    <CatalogPage
      eyebrow="Cloth"
      title="Apparel"
      intro="Artwork printed on heavyweight cotton. Cut for a relaxed fit."
      category="APPAREL"
    />
  );
}
