import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Shipping Policy",
  robots: { index: false },
};

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping Policy" updated="[DATE]">
      <section>
        <h2>Production times</h2>
        <p>
          Apparel and prints are made to order by our print-on-demand
          partners once you place an order — nothing sits on a shelf waiting
          to be shipped. Typical production time is{" "}
          <strong className="text-bone">[2–7 business days]</strong> before
          your order ships. Original one-of-a-kind pieces, when sold, ship
          separately within <strong className="text-bone">[X business days]</strong>.
        </p>
      </section>

      <section>
        <h2>Shipping times &amp; cost</h2>
        <p>
          Once production is complete, standard shipping within the United
          States typically takes <strong className="text-bone">[3–7 business days]</strong>.
          International shipping times and customs handling vary by
          destination. Shipping cost is calculated at checkout based on
          weight, size, and destination.
        </p>
      </section>

      <section>
        <h2>Order tracking</h2>
        <p>
          You&rsquo;ll receive a shipping confirmation email with tracking
          information as soon as your order leaves production. If you don&rsquo;t
          receive one within the production window above, check your spam
          folder or contact us.
        </p>
      </section>

      <section>
        <h2>Multiple items</h2>
        <p>
          If your order contains items produced by different partners or in
          different formats (for example, apparel and a paper print), they
          may ship separately and arrive on different days.
        </p>
      </section>

      <section>
        <h2>Lost or damaged in transit</h2>
        <p>
          If your order arrives damaged, or tracking shows delivery but you
          never received it, contact us at{" "}
          <strong className="text-bone">[SUPPORT EMAIL]</strong> within{" "}
          <strong className="text-bone">[X days]</strong> of the delivery date
          with your order number and, for damage, a photo. We&rsquo;ll arrange a
          replacement or refund.
        </p>
      </section>

      <section>
        <h2>Address accuracy</h2>
        <p>
          Please double-check your shipping address at checkout. We are not
          responsible for orders shipped to an incorrectly entered address,
          though we&rsquo;ll do what we can to help if you catch it before
          production begins.
        </p>
      </section>

      <section>
        <h2>Customs &amp; import fees</h2>
        <p>
          International orders may be subject to customs duties, taxes, or
          import fees charged by your country. These are the responsibility
          of the recipient and are not included in your order total.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          Questions about a shipment? Email{" "}
          <strong className="text-bone">[SUPPORT EMAIL]</strong> with your
          order number.
        </p>
      </section>
    </LegalPage>
  );
}
