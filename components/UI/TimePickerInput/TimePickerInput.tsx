'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import css from './TimePickerInput.module.css';

interface TimePickerInputProps {
  /** 'HH:mm' string, or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  /** Slot granularity in minutes. Default 30 — per-minute picking is
   *  intentionally not offered (planning only needs half-hour slots). */
  stepMinutes?: number;
  /** Inclusive first hour of the slot range (0-23). Default 0. */
  minHour?: number;
  /** Exclusive last-hour boundary (1-24). Default 24. */
  maxHour?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Custom time picker that mirrors DatePickerInput's chrome (gray
 * trigger box + white popover) so time fields sit flush with the
 * calendar date fields. The popover is a scrollable list of fixed
 * slots (default every 30 min) instead of a native <input type="time">
 * spinner — this drops per-minute input, which planning doesn't need.
 */
const TimePickerInput = ({
  value,
  onChange,
  placeholder,
  id,
  stepMinutes = 30,
  minHour = 0,
  maxHour = 24,
}: TimePickerInputProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let m = minHour * 60; m < maxHour * 60; m += stepMinutes) {
      out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    return out;
  }, [stepMinutes, minHour, maxHour]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Bring the selected slot into view each time the popover opens so a
  // late-day time isn't hidden below the scroll fold.
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const pick = (slot: string) => {
    onChange(slot);
    setOpen(false);
  };

  return (
    <div className={css.container} ref={ref}>
      <button
        type="button"
        id={id}
        className={`${css.trigger} ${open ? css.triggerOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`${css.triggerLabel} ${!value ? css.placeholder : ''}`}
        >
          {value || placeholder || ''}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={css.clockIcon}
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
      </button>

      {open && (
        <div className={css.popover}>
          <ul className={css.list}>
            {slots.map((slot) => {
              const isSelected = slot === value;
              return (
                <li key={slot}>
                  <button
                    type="button"
                    ref={isSelected ? selectedRef : undefined}
                    className={`${css.slot} ${isSelected ? css.slotSelected : ''}`}
                    onClick={() => pick(slot)}
                  >
                    {slot}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimePickerInput;
