/**
 * Seal — the verification mark, shown only at verified completion
 * (settlement confirmed, receipt sealed). Resolves via a short stroke
 * transition (420ms, ≤500ms max special) in the warm signature color.
 * No confetti, no repeated rotation, no glitter. Under reduced motion it
 * renders fully resolved, instantly.
 */
export function Seal({
  title = "Receipt sealed",
  sub,
  size = 40,
}: {
  title?: string;
  sub?: string;
  size?: number;
}) {
  return (
    <span className="seal" role="img" aria-label={sub ? `${title}. ${sub}` : title}>
      <svg
        className="seal__mark"
        style={{ width: size, height: size }}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2"
          pathLength={114}
        />
        <path
          d="M12.5 20.8l5 4.8L28 15"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={24}
        />
      </svg>
      <span className="seal__label">
        <span className="seal__title">{title}</span>
        {sub && <span className="seal__sub">{sub}</span>}
      </span>
    </span>
  );
}
