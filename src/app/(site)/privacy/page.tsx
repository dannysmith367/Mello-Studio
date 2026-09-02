import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="[DATE]">
      <p>
        Mello Studio (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
        respects your privacy. This policy explains what information we
        collect when you visit or buy from{" "}
        <strong className="text-bone">[SITE URL]</strong>, how we use it, and
        the choices you have. It applies to this website only.
      </p>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong className="text-bone">Order &amp; contact information</strong> — name, email,
            shipping and billing address, and phone number, collected when
            you place an order or contact us.
          </li>
          <li>
            <strong className="text-bone">Payment information</strong> — payments are processed by
            Stripe. We never see or store your full card number; Stripe
            handles that under its own privacy policy.
          </li>
          <li>
            <strong className="text-bone">Newsletter signups</strong> — your email address, if you
            choose to subscribe, plus which page you subscribed from.
          </li>
          <li>
            <strong className="text-bone">Usage data</strong> — basic technical information (browser
            type, pages visited, approximate location from IP address) collected
            automatically to keep the site working and secure.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To process and fulfil your orders, including passing shipping
            details to our print-on-demand partner (currently Printify) so
            they can produce and ship your item.</li>
          <li>To send order confirmations, shipping updates, and respond to
            customer service requests.</li>
          <li>To send newsletter emails, only to addresses that have
            confirmed a subscription, and only until you unsubscribe.</li>
          <li>To detect fraud, keep the site secure, and comply with legal
            obligations.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>
          We share the minimum information necessary with: our payment
          processor (Stripe), our fulfilment partner (Printify), and our
          email delivery provider (Resend). We do not sell your personal
          information to third parties.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use a small number of cookies required for the site to function
          — for example, to remember what&rsquo;s in your shopping bag. We do
          not use third-party advertising or tracking cookies.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Unsubscribe from the newsletter at any time using the link at
            the bottom of every email.</li>
          <li>Request a copy of, correction to, or deletion of your personal
            data by emailing <strong className="text-bone">[PRIVACY CONTACT EMAIL]</strong>.</li>
        </ul>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We keep order records as long as required for tax, accounting, and
          legal purposes. Newsletter addresses are kept until you unsubscribe
          or ask us to delete them.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>This site is not directed at children under 13, and we do not
          knowingly collect information from them.</p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>We may update this policy from time to time. Material changes will
          be reflected by the &ldquo;Last updated&rdquo; date above.</p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          Questions about this policy? Email{" "}
          <strong className="text-bone">[PRIVACY CONTACT EMAIL]</strong> or write to{" "}
          <strong className="text-bone">[BUSINESS MAILING ADDRESS]</strong>.
        </p>
      </section>
    </LegalPage>
  );
}
