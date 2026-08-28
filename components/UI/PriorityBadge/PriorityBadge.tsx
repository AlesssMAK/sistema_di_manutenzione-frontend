'use client';

import { useTranslations } from 'next-intl';
import type { PriorityFaultType } from '@/types/faultType';
import css from './PriorityBadge.module.css';

const levelClass: Record<string, string> = {
  Low: css.low,
  Medium: css.medium,
  High: css.high,
};

interface PriorityBadgeProps {
  priority: PriorityFaultType;
  /** Extra class for spacing tweaks at the call site. */
  className?: string;
}

// Canonical fault-priority pill: green (Low) / amber (Medium) / red
// (High). Single source of truth so every list, card and detail page
// renders the priority identically.
const PriorityBadge = ({ priority, className = '' }: PriorityBadgeProps) => {
  const t = useTranslations('Priority');
  return (
    <span
      className={`${css.badge} ${levelClass[priority] ?? ''} ${className}`}
    >
      {t(priority)}
    </span>
  );
};

export default PriorityBadge;
