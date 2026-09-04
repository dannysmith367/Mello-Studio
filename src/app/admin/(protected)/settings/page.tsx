import { getAboutImageUrl, getPageIntros, getShippingSettings, getSocialLinks } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";
import { AboutImageUpload } from "./AboutImageUpload";
import { ShippingSettingsForm } from "./ShippingSettingsForm";
import { PageIntroForm } from "./PageIntroForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [social, aboutImageUrl, shipping, intros] = await Promise.all([
    getSocialLinks(),
    getAboutImageUrl(),
    getShippingSettings(),
    getPageIntros(),
  ]);

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_BUCKET_ORIGINALS ?? "artwork-originals";

  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight">Settings</h1>

      <section className="mt-6">
        <h2 className="font-display text-lg font-medium tracking-tight">Social links</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Shown as icons in the site footer.
        </p>
        <div className="mt-4">
          <SettingsForm social={social} />
        </div>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-lg font-medium tracking-tight">About page portrait</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Shown beside the bio on /about. Hidden entirely until an image is set.
        </p>
        <div className="mt-4">
          {supabaseUrl && anonKey ? (
            <AboutImageUpload
              currentUrl={aboutImageUrl}
              supabaseUrl={supabaseUrl}
              supabaseAnonKey={anonKey}
              bucket={bucket}
            />
          ) : (
            <p className="border border-rule bg-surface p-4 font-data text-xs text-muted">
              Storage is not configured — add your Supabase keys to .env.
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-lg font-medium tracking-tight">Shipping</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Applied at checkout and shown in the cart before then. US addresses only for now.
        </p>
        <div className="mt-4">
          <ShippingSettingsForm shipping={shipping} />
        </div>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-lg font-medium tracking-tight">Page intros</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          The intro sentence under the heading on /shop, /apparel and /prints.
        </p>
        <div className="mt-4">
          <PageIntroForm intros={intros} />
        </div>
      </section>
    </>
  );
}
