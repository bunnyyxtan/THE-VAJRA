"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Reveal } from "./reveal";

/**
 * Code-drawn mini product cards (styled divs, not screenshots) floating in
 * 3D perspective around the headline. Pointer parallax writes CSS custom
 * properties directly to the DOM — transform-only, GPU-friendly, no
 * per-frame React state. Tilt is disabled on touch devices and under
 * prefers-reduced-motion.
 */
export function Hero() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = cardsRef.current;
    if (!cards) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    if (!fine.matches || reduced.matches || !wide.matches) return;

    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      cards.style.setProperty("--px", x.toFixed(3));
      cards.style.setProperty("--py", y.toFixed(3));
    };
    const onLeave = () => {
      cards.style.setProperty("--px", "0");
      cards.style.setProperty("--py", "0");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__stage">
        <div className="hero__copy">
          <Reveal>
            <p className="hero__eyebrow">
              <span className="hero__eyebrow-dot" aria-hidden="true" />
              MONAD MAINNET · CHAIN 143
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="hero__title" id="hero-title">
              Signed by them.
              <br />
              <em>Final on Monad.</em>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="hero__sub">
              VAJRA turns a payment request into a signed instrument. The
              recipient signs the exact terms, the payer sends the exact
              amount, and the contract settles it directly — leaving a
              receipt anyone can verify onchain.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="hero__ctas">
              <Link href="/request" className={buttonClasses({ size: "lg" })}>
                Create a request
              </Link>
              <Link href="/pay" className={buttonClasses({ variant: "secondary", size: "lg" })}>
                Open a payment
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="hero__cards" ref={cardsRef} aria-hidden="true">
          {/* payment request card */}
          <div className={cx("hcard", "hcard--request", "v-glass")}>
            <div className="hcard__head">
              <span className="hcard__kind">PAYMENT REQUEST</span>
              <span className="hcard__pill hcard__pill--signed">Signed</span>
            </div>
            <div className="hcard__amount">
              128.40 <small>MON</small>
            </div>
            <div className="hcard__rows">
              <div className="hcard__row">
                <span>To</span>
                <span>0x8f3c…a91c</span>
              </div>
              <div className="hcard__row">
                <span>Memo</span>
                <span>Invoice 014</span>
              </div>
              <div className="hcard__row">
                <span>Expires</span>
                <span>7 days</span>
              </div>
            </div>
            <div className="hcard__steps">
              <span className="hcard__step-dot hcard__step-dot--done" />
              <span className="hcard__step-line hcard__step-line--done" />
              <span className="hcard__step-dot hcard__step-dot--done" />
              <span className="hcard__step-line" />
              <span className="hcard__step-dot" />
            </div>
          </div>

          {/* sealed receipt card */}
          <div className={cx("hcard", "hcard--receipt", "v-glass")}>
            <div className="hcard__head">
              <span className="hcard__kind">RECEIPT</span>
              <span className="hcard__pill hcard__pill--sealed">Sealed</span>
            </div>
            <div className="hcard__amount">
              128.40 <small>MON</small>
            </div>
            <div className="hcard__rows">
              <div className="hcard__row">
                <span>Paid by</span>
                <span>0x2b71…e0d4</span>
              </div>
              <div className="hcard__row">
                <span>Transaction</span>
                <span>0x4be9…9c2f</span>
              </div>
              <div className="hcard__row">
                <span>Settlement</span>
                <span>Final</span>
              </div>
            </div>
            <div className="hcard__steps">
              <span className="hcard__step-dot hcard__step-dot--done" />
              <span className="hcard__step-line hcard__step-line--done" />
              <span className="hcard__step-dot hcard__step-dot--done" />
              <span className="hcard__step-line hcard__step-line--done" />
              <span className="hcard__step-dot hcard__step-dot--sealed" />
            </div>
          </div>

          {/* verification ledger card */}
          <div className={cx("hcard", "hcard--ledger", "v-glass")}>
            <div className="hcard__head">
              <span className="hcard__kind">VERIFICATION</span>
            </div>
            <div className="hcard__rows" style={{ borderTop: "none" }}>
              <div className="hcard__row">
                <span>Signature</span>
                <span>EIP-712 · valid</span>
              </div>
              <div className="hcard__row">
                <span>Contract</span>
                <span>VajraNativeV1</span>
              </div>
              <div className="hcard__row">
                <span>Address</span>
                <span>0x7d17…299f</span>
              </div>
            </div>
          </div>

          {/* floating chip */}
          <div className={cx("hcard", "hcard--chip", "v-glass")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            One request · one payment
          </div>
        </div>
      </div>
    </section>
  );
}
