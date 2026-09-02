import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Returns & Refunds",
  robots: { index: false },
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns & Refunds Policy" updated="[DATE]">
      <section>
        <h2>Made-to-order items</h2>
        <p>
          Every apparel item and print is made specifically for you when you
          order it, so we&rsquo;re unable to offer returns or exchanges for
          the wrong size chosen or a change of mind. Please check size charts
          and product details carefully before ordering.
        </p>
      </section>

      <section>
        <h2>Damaged, misprinted, or defective items</h2>
        <p>
          If your item arrives damaged, misprinted, or otherwise defective,
          we&rsquo;ll send a free replacement — no need to ship anything back.
          Report it at <a href="/support">/support</a> within 30 days of
          delivery with your order number and a photo of the issue, and
          we&rsquo;ll take it from there.
        </p>
      </section>

      <section>
        <h2>Original artwork</h2>
        <p>
          One-of-a-kind original pieces may be returned within{" "}
          <strong className="text-bone">[X days]</strong> of delivery for a
          refund, provided the piece is returned in its original condition
          and packaging. The customer is responsible for return shipping and
          for insuring the piece in transit, unless the return is due to our
          error.
        </p>
      </section>

      <section>
        <h2>How refunds work</h2>
        <p>
          Approved refunds are issued to your original payment method within{" "}
          <strong className="text-bone">[5–10 business days]</strong> of us
          confirming the issue. You&rsquo;ll receive an email once the refund is
          processed. Depending on your bank, it may take a few additional
          days to appear on your statement.
        </p>
      </section>

      <section>
        <h2>Cancellations</h2>
        <p>
          Because production begins shortly after ordering, we can only
          cancel or change an order if you contact us before it enters
          production. Once production has started, it can no longer be
          cancelled.
        </p>
      </section>

      <section>
        <h2>Commissions</h2>
        <p>
          Refund terms for a custom commission are agreed with the customer
          individually before work begins, and take precedence over this
          policy for that piece.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          To report a problem with an order, go to{" "}
          <a href="/support">/support</a> with your order number to hand.
        </p>
      </section>
    </LegalPage>
  );
}
