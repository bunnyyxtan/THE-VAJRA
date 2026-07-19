import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Wave 1 placeholder Home — verifies the token system end to end
 * (palette, typography, spacing, motion) in both appearances.
 * The real Home screen arrives in Wave 2.
 */
const SWATCHES: Array<{ name: string; token: string }> = [
  { name: "Background", token: "--bg" },
  { name: "Surface", token: "--surface" },
  { name: "Raised", token: "--raised" },
  { name: "Selected", token: "--selected" },
  { name: "Border", token: "--border" },
  { name: "Border strong", token: "--border-strong" },
  { name: "Action", token: "--action" },
  { name: "Signature", token: "--signature" },
  { name: "Success", token: "--success" },
  { name: "Warning", token: "--warning" },
  { name: "Danger", token: "--danger" },
  { name: "Info", token: "--info" },
];

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64];

const MOTION = [
  ["--motion-instant", "90ms"],
  ["--motion-fast", "140ms"],
  ["--motion-standard", "200ms"],
  ["--motion-panel", "260ms"],
  ["--motion-route", "300ms"],
  ["--motion-signature", "420ms"],
];

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4) var(--space-8)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-7)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--type-page-title)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            VAJRA
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--type-body)" }}>
            Recipient-authenticated payments on Monad
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>Palette</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {SWATCHES.map((s) => (
            <div
              key={s.token}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 48, background: `var(${s.token})` }} />
              <div style={{ padding: "var(--space-2) var(--space-3)" }}>
                <div style={{ fontSize: "var(--type-compact)", fontWeight: 600 }}>{s.name}</div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: "var(--type-metadata)" }}>
                  var({s.token})
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>Typography</h2>
        <p style={{ fontSize: "var(--type-page-title)", fontWeight: 700 }}>Page title 28–40</p>
        <p style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>Section heading 20–24</p>
        <p style={{ fontSize: "var(--type-component)", fontWeight: 600 }}>Component title 16–18</p>
        <p style={{ fontSize: "var(--type-body)" }}>Body copy 15–16, sentence case, Manrope.</p>
        <p style={{ fontSize: "var(--type-compact)", color: "var(--text-secondary)" }}>
          Compact 13–14 for dense supporting text.
        </p>
        <p className="mono" style={{ fontSize: "var(--type-metadata)", color: "var(--text-muted)" }}>
          0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f · IBM Plex Mono, technical identifiers only
        </p>
        <p
          className="tnum"
          style={{ fontSize: "var(--type-amount)", fontWeight: 700, lineHeight: 1.1 }}
        >
          0.00
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>Spacing</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {SPACING.map((n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "center" }}>
              <div style={{ width: n, height: n, background: "var(--border-strong)", borderRadius: 2 }} />
              <span className="mono" style={{ fontSize: "var(--type-metadata)", color: "var(--text-muted)" }}>{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>Motion</h2>
        <dl className="ledger">
          {MOTION.map(([token, value]) => (
            <div key={token} className="ledger-row">
              <dt className="ledger-row__label mono">{token}</dt>
              <dd className="ledger-row__value tnum" style={{ margin: 0 }}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
