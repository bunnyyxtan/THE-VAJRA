"use client";

import { useEffect, useRef } from "react";
import styles from "./hero.module.css";

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (cardARef.current)
        cardARef.current.style.transform = `rotateY(${cx * 14 - 8}deg) rotateX(${-cy * 12 + 6}deg) translate3d(${cx * 18}px, ${cy * 14}px, 60px)`;
      if (cardBRef.current)
        cardBRef.current.style.transform = `rotateY(${cx * 10 + 10}deg) rotateX(${-cy * 8 - 4}deg) translate3d(${cx * -14}px, ${cy * -10}px, 30px)`;
      if (headRef.current)
        headRef.current.style.transform = `translate3d(${cx * -6}px, ${cy * -4}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    stage.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <span className={styles.wordmark}>
          VAJRA<span className={styles.wordmarkDot} />
        </span>
        <span className={styles.networkPill}>
          <span className={styles.networkDot} />
          Monad Mainnet
        </span>
      </header>

      <div className={styles.stage} ref={stageRef}>
        {/* floating tx chip — deepest layer, heaviest frost */}
        <div className={`${styles.card} ${styles.chip}`}>
          <span className={`mono ${styles.chipHash}`}>0x94ca…09a2</span>
          <span className={styles.chipStatus}>
            <span className={styles.chipDot} />
            settled
          </span>
        </div>

        {/* floating request card — the toy */}
        <div className={`${styles.card} ${styles.cardA}`} ref={cardARef}>
          <div className={styles.cardTop}>
            <span className={`mono ${styles.cardLabel}`}>VAJRA REQUEST</span>
            <span className={styles.cardDot} />
          </div>
          <div className={styles.amount}>
            0.01 <span className={styles.amountUnit}>MON</span>
          </div>
          <div className={styles.rule} />
          <div className={styles.row}>
            <span>To</span>
            <span className="mono">0xEB9c…463E</span>
          </div>
          <div className={styles.row}>
            <span>Expires</span>
            <span className="mono">24 h</span>
          </div>
          <div className={styles.row}>
            <span>Code</span>
            <span className="mono">2481-960B</span>
          </div>
          <div className={styles.rule} />
          <div className={styles.signedRow}>
            <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
              <path d="M2.5 7l2.6 2.6L10.5 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Signed by recipient
          </div>
        </div>

        {/* floating seal card */}
        <div className={`${styles.card} ${styles.cardB}`} ref={cardBRef}>
          <div className={styles.sealWrap}>
            <svg className={styles.seal} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.sealRing} />
              <path d="M20 33l8 8 16-17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={styles.sealCheck} />
            </svg>
          </div>
          <div className={styles.sealText}>Sealed on Monad</div>
          <div className={`mono ${styles.sealMeta}`}>block 88,702,234 · final</div>
        </div>

        {/* headline + actions */}
        <div className={styles.center} ref={headRef}>
          <h1 className={styles.headline}>
            Signed by them.
            <br />
            <span className={styles.headlineAccent}>Final on Monad.</span>
          </h1><p className={styles.sub}>
            Payment requests the recipient signs before you pay. One exact
            amount, one recipient, one settlement — verified onchain, sealed
            forever.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/request">
              Create a request
            </a>
            <a className={styles.ghost} href="/pay">
              Open a payment
            </a>
          </div>
          <div className={styles.truthRow}>
            <span className="mono">0x7d17…8299f</span>
            <span className={styles.truthSep} />
            <span>Verified contract</span>
            <span className={styles.truthSep} />
            <span>No custody</span>
          </div>
        </div>
      </div>

      <div className={styles.ghost} aria-hidden="true">
        VAJRA
      </div>
    </main>
  );
}
