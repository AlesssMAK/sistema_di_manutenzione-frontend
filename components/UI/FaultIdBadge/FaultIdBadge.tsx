import css from './FaultIdBadge.module.css';

interface FaultIdBadgeProps {
  /** Human-readable fault id, e.g. "SEG-2026-06-008". */
  id: string;
  /** "sm" is a compact variant for tight spots (e.g. calendar slots). */
  size?: 'sm';
  /** Optional extra class for edge-case sizing/spacing overrides. */
  className?: string;
}

// The single source of truth for how a fault id looks across the app —
// a blue pill badge. Use it everywhere a fault id is displayed.
const FaultIdBadge = ({ id, size, className }: FaultIdBadgeProps) => (
  <span
    className={`${css.badge} ${size === 'sm' ? css.sm : ''} ${className ?? ''}`}
  >
    {id}
  </span>
);

export default FaultIdBadge;
