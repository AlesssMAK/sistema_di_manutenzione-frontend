'use client';

import css from './Toggle.module.css';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * iOS-style switch shared across the app (same look as the user-status
 * toggle). A visually-hidden checkbox drives a styled label track.
 */
const Toggle = ({ id, checked, onChange, label, disabled }: ToggleProps) => (
  <div className={css.container}>
    <input
      id={id}
      type="checkbox"
      className={css.input}
      checked={checked}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
    />
    <label htmlFor={id} className={css.track} />
    {label && <span className={css.labelText}>{label}</span>}
  </div>
);

export default Toggle;
