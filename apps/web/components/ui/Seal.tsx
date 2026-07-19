import { cx } from "./cx";

/**
 * The SEAL: rendered only at verified completion (settlement confirmed by
 * chain evidence). One meaningful animation — ring and check stroke draw
 * in 420ms with the emphasis easing — then it is still. Static under
 * reduced motion.
 */
export function Seal({
  size = 72,
  /** Primary line under the mark, e.g. "Receipt sealed". */
  title,
  /** Secondary mono line, e.g. "VajraNativeV1 · Monad Mainnet · chain 143". */
  sub,
  animate = true,
  className,
}: {
  size?: number;
  title?: string;
  sub?: string;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx("vseal", animate && "vseal--animate", className)}
      role="img"
      aria-label={title ?? "Verified"}
    >
      <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
        <circle
          className="vseal__ring"
          cx="36"
          cy="36"
          r="30"
          strokeWidth="2.5"
          pathLength={100}
          transform="rotate(-90 36 36)"
        />
        <path
          className="vseal__check"
          d="M23 37.5l8.5 8L49 27"
          strokeWidth="3.5"
          pathLength={100}
        />
      </svg>
      {(title || sub) && (
        <span className="vseal__text">
          {title && <span className="vseal__label">{title}</span>}
          {sub && <span className="vseal__sub">{sub}</span>}
        </span>
      )}
    </span>
  );
}
