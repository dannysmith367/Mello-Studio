import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="[DATE]">
      <p>
        These terms govern your use of{" "}
        <strong className="text-bone">[SITE URL]</strong> and any purchase you
        make from Mello Studio, a sole proprietorship based in{" "}
        <strong className="text-bone">[STATE]</strong>, United States. By using
        the site or placing an order, you agree to them.
      </p>

      <section>
        <h2>Products</h2>
        <p>
          We sell original and reproduction artwork, apparel, and art prints.
          Apparel and prints are made to order by our print-on-demand
          partners; because of this, minor variations in color and placement
          between what you see on screen and the finished item are normal and
          not a defect.
        </p>
      </section>

      <section>
        <h2>Pricing &amp; payment</h2>
        <p>
          All prices are listed in US dollars and do not include tax or
          shipping unless stated. Payment is processed securely by Stripe at
          checkout. We reserve the right to correct pricing errors and to
          cancel and refund an order placed at an incorrect price.
        </p>
      </section>

      <section>
        <h2>Order acceptance</h2>
        <p>
          Your order is an offer to buy. We may decline or cancel any order
          — for example, for suspected fraud, an item going out of stock, or
          a pricing error — in which case we will refund any payment taken in
          full.
        </p>
      </section>

      <section>
        <h2>Shipping &amp; risk of loss</h2>
        <p>
          See our <a href="/shipping">Shipping Policy</a> for delivery times
          and costs. Risk of loss and title for items you purchase pass to
          you upon delivery to the carrier.
        </p>
      </section>

      <section>
        <h2>Returns &amp; refunds</h2>
        <p>
          See our <a href="/returns">Returns &amp; Refunds Policy</a> for the
          full detail.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          All artwork, designs, photography, and site content are the
          property of Mello Studio and may not be reproduced, distributed, or
          used to create derivative products without written permission.
          Purchasing a physical product does not transfer any copyright in
          the underlying artwork.
        </p>
      </section>

      <section>
        <h2>Commissions</h2>
        <p>
          Custom commission work is governed by the specific terms agreed
          with the customer at the time (scope, price, timeline, and usage
          rights). These general terms apply in addition, where they do not
          conflict.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Mello Studio is not liable
          for indirect, incidental, or consequential damages arising from
          your use of the site or purchase of a product. Our total liability
          for any claim is limited to the amount you paid for the item in
          question.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the State of{" "}
          <strong className="text-bone">[STATE]</strong>, without regard to
          conflict-of-law principles.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          site after a change constitutes acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          Questions about these terms? Email{" "}
          <strong className="text-bone">[CONTACT EMAIL]</strong>.
        </p>
      </section>
    </LegalPage>
  );
}
