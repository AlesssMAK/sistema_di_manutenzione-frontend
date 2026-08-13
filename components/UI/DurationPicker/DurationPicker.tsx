'use client';

import { useTranslations } from 'next-intl';
import SelectDropdown from '../SelectDropdown/SelectDropdown';
import { roundToStep, splitMinutes } from '@/lib/utils/faultTime';
import css from './DurationPicker.module.css';

interface DurationPickerProps {
  /** Current total in minutes. */
  valueMinutes: number;
  /** Emits the new total in minutes (always slot-aligned). */
  onChange: (minutes: number) => void;
  maxDays?: number;
  disabled?: boolean;
}

const range = (max: number, step = 1): string[] =>
  Array.from({ length: Math.floor(max / step) + 1 }, (_, i) =>
    String(i * step)
  );

const DAY_OPTIONS_DEFAULT = 30;
const HOUR_OPTIONS = range(23);
const MINUTE_OPTIONS = ['0', '15', '30', '45'];

// Days / hours / minutes chosen from slot dropdowns (minutes step 15,
// hours/days step 1). Stores the combined total in minutes.
const DurationPicker = ({
  valueMinutes,
  onChange,
  maxDays = DAY_OPTIONS_DEFAULT,
  disabled = false,
}: DurationPickerProps) => {
  const tDur = useTranslations('Duration');
  const { days, hours, minutes } = splitMinutes(roundToStep(valueMinutes));

  const dayOptions = range(maxDays);

  const emit = (d: number, h: number, m: number) =>
    onChange(d * 1440 + h * 60 + m);

  return (
    <div className={css.group}>
      <div className={css.unit}>
        <SelectDropdown
          options={dayOptions}
          selectedValue={String(days)}
          onSelect={v => emit(Number(v), hours, minutes)}
          disabled={disabled}
        />
        <span className={css.label}>{tDur('d')}</span>
      </div>
      <div className={css.unit}>
        <SelectDropdown
          options={HOUR_OPTIONS}
          selectedValue={String(hours)}
          onSelect={v => emit(days, Number(v), minutes)}
          disabled={disabled}
        />
        <span className={css.label}>{tDur('h')}</span>
      </div>
      <div className={css.unit}>
        <SelectDropdown
          options={MINUTE_OPTIONS}
          selectedValue={String(minutes)}
          onSelect={v => emit(days, hours, Number(v))}
          disabled={disabled}
        />
        <span className={css.label}>{tDur('m')}</span>
      </div>
    </div>
  );
};

export default DurationPicker;
