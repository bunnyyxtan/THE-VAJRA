import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Reveal } from "./reveal";

/**
 * Closing call to action over a subtle dot grid. One message, one primary
 * action — calm, not confetti.
 */
export function CtaBanner() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta__dots" aria-hidden="true" />
      <div className="cta__inner">
        <Reveal>
          <h2 className="cta__title" id="cta-title">
            Terms signed. Payment final.
            <br />
            Receipt sealed.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="cta__sub">
            Create a signed request, share the link, and let the contract do
            the rest. Settlement leaves proof you can hand to anyone.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <div className="cta__actions">
            <Link href="/request" className={buttonClasses({ size: "lg" })}>
              Create a request
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
