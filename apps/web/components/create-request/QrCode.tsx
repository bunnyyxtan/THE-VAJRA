"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QrCode — renders the payment link as a static SVG QR code.
 *
 * The QR is a scannability artifact, not themed chrome: it always renders
 * dark modules on a white backing, because scanners require that contrast
 * contract regardless of the app appearance. This is the one deliberate
 * exception to the token-only color rule, and it is confined to this file.
 * No drawing animation — the code appears cleanly, per the screen grammar.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: "#17131b", light: "#ffffff" },
    })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) {
    return (
      <div
        className="qr__frame qr__frame--pending"
        role="status"
        aria-label="Generating QR code"
      >
        <span className="skeleton skeleton--block qr__skeleton" />
      </div>
    );
  }

  return (
    <div className="qr__frame">
      <div
        className="qr__code"
        role="img"
        aria-label={label}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
