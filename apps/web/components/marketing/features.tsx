"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui/cx";
import { Reveal } from "./reveal";

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  /** What the sticky card shows while this feature is active. */
  stage: { pill: string; sealed?: boolean; line: [string, string] };
}

const FEATURES: Feature[] = [
  {
    eyebrow: "SIGNED TERMS",
    title: "The recipient signs before money moves",
    body: "Every request carries the recipient's signature over the exact terms — amount, payer, expiry, memo hash. The contract verifies that signature on every payment attempt, so the terms on screen are the terms that settle.",
    stage: { pill: "Terms signed", line: ["Signature", "EIP-712 · valid"] },
  },
  {
    eyebrow: "PASSKEY AUTHENTICATION",
    title: "Sign with the device in your pocket",
    body: "A recipient can register a passkey once and sign every request with a device confirmation. The contract verifies the P-256 signature onchain — no browser extension required on the receiving side.",
    stage: { pill: "Passkey verified", line: ["Credential", "P-256 · registered"] },
  },
  {
    eyebrow: "ONE REQUEST, ONE PAYMENT",
    title: "Paid once, then closed forever",
    body: "Each request settles exactly once. The moment it is fulfilled, the contract rejects every further attempt — a duplicate payment is structurally impossible, not just unlikely.",
    stage: { pill: "Paid once", line: ["Status", "Fulfilled · replay rejected"] },
  },
  {
    eyebrow: "DIRECT SETTLEMENT",
    title: "Exact value, straight to the recipient",
    body: "The payer sends the exact amount to the contract, and the same transaction forwards native MON to the recipient. No custody, no escrow window, no intermediate account holding funds.",
    stage: { pill: "Settled direct", line: ["Transfer", "Native MON · same tx"] },
  },
  {
    eyebrow: "VERIFIABLE RECEIPT",
    title: "A receipt that proves itself",
    body: "Settlement is established from the PaymentFulfilled event and the contract's own state — never from a wallet notification or a screenshot. Anyone can check the receipt against the chain.",
    stage: { pill: "Receipt sealed", sealed: true, line: ["Evidence", "Event + state · final"] },
  },
];

/**
 * Sticky instrument on the left morphs through proof-chain stages while
 * feature blocks scroll past on the right; an IntersectionObserver marks
 * the centered block active. On small screens the card sits on top,
 * static, and every block reads at full opacity.
 */
export function Features() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    for (const el of itemRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const stage = FEATURES[active].stage;

  return (
    <section className="features" aria-label="How VAJRA works">
      <div className="features__sticky">
        <Reveal>
          <div className={cx("features__stagecard", "v-glass")} aria-hidden="true">
            <div className="hcard__head">
              <span className="hcard__kind">PAYMENT REQUEST</span>
              <span
                className={cx(
                  "hcard__pill",
                  stage.sealed ? "hcard__pill--sealed" : "hcard__pill--signed",
                )}
              >
                {stage.pill}
              </span>
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
                <span>{stage.line[0]}</span>
                <span>{stage.line[1]}</span>
              </div>
            </div>
            <div className="hcard__steps">
              {FEATURES.map((feature, i) => (
                <span key={feature.eyebrow} style={{ display: "contents" }}>
                  <span
                    className={cx(
                      "hcard__step-dot",
                      i < active && "hcard__step-dot--done",
                      i === active &&
                        (feature.stage.sealed ? "hcard__step-dot--sealed" : "hcard__step-dot--done"),
                    )}
                    style={
                      i === active && !feature.stage.sealed
                        ? { boxShadow: "0 0 0 3px var(--v-focus-ring)" }
                        : undefined
                    }
                  />
                  {i < FEATURES.length - 1 && (
                    <span
                      className={cx("hcard__step-line", i < active && "hcard__step-line--done")}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
          <p className="features__stagecaption">
            {String(active + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")} —{" "}
            {stage.pill}
          </p>
        </Reveal>
      </div>

      <div>
        {FEATURES.map((feature, i) => (
          <article
            key={feature.eyebrow}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            data-index={i}
            className={cx("feature", i === active && "is-active")}
            aria-label={feature.title}
          >
            <p className="feature__eyebrow">{feature.eyebrow}</p>
            <h2 className="feature__title">{feature.title}</h2>
            <p className="feature__body">{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
