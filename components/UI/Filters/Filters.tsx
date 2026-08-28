'use client';

import { useTranslations } from 'next-intl';
import Button from '../Button/Button';
import Input from '../Input/Input';
import SelectDropdown from '../SelectDropdown/SelectDropdown';
import DatePickerInput from '../DatePickerInput/DatePickerInput';
import DateRangePickerInput from '../DateRangePickerInput/DateRangePickerInput';
import css from './Filters.module.css';

interface FiltersTypes {
  id: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'daterange';
}

interface FiltersInput extends FiltersTypes {
  type: 'input';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
}

interface FiltersSelect extends FiltersTypes {
  type: 'select';
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

interface FiltersDate extends FiltersTypes {
  type: 'date';
  // ISO 'YYYY-MM-DD' or '' — rendered via the localized
  // DatePickerInput so dates follow the active app language.
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FiltersDateRange extends FiltersTypes {
  type: 'daterange';
  // Both ISO 'YYYY-MM-DD' or '' — picked on one calendar.
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
}

export type FiltersItem =
  | FiltersInput
  | FiltersSelect
  | FiltersDate
  | FiltersDateRange;

export interface FiltersProps {
  items: FiltersItem[];
  onClear: () => void;
  /** Force a single stacked column at every width (e.g. in a narrow
   *  sidebar), overriding the desktop single-row layout. */
  stacked?: boolean;
}

const Filters = ({ items, onClear, stacked = false }: FiltersProps) => {
  const t = useTranslations('Filters');

  return (
    <div className={css.filters_container}>
      <div className={css.head_container}>
        <div className={css.title_container}>
          <svg width="20" height="20" className={css.filter_icon}>
            <use href="/sprite.svg#filter"></use>
          </svg>
          <h1 className={css.title}>{t('title')}</h1>
        </div>
        <Button
          type="button"
          className="button button--white"
          height={36}
          onClick={onClear}
        >
          {t('clear')}
        </Button>
      </div>
      <div
        className={`${css.select_container} ${stacked ? css.stacked : ''}`}
      >
        {items.map(item => {
          if (item.type === 'input') {
            return (
              <div key={item.id} className={css.filter_item}>
                <p className={css.label}>{item.label}</p>
                <Input
                  value={item.value}
                  onChange={e => item.onChange(e.target.value)}
                  placeholder={item.placeholder}
                  icon={item.icon}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
              </div>
            );
          }

          if (item.type === 'select') {
            return (
              <div key={item.id} className={css.filter_item}>
                <p className={css.label}>{item.label}</p>
                <SelectDropdown
                  options={item.options}
                  selectedValue={item.value}
                  onSelect={item.onSelect}
                  placeholder={item.placeholder || ''}
                  disabled={false}
                />
              </div>
            );
          }

          if (item.type === 'date') {
            return (
              <div key={item.id} className={css.filter_item}>
                <p className={css.label}>{item.label}</p>
                <DatePickerInput
                  value={item.value}
                  onChange={item.onChange}
                  placeholder={item.placeholder}
                />
              </div>
            );
          }

          if (item.type === 'daterange') {
            return (
              <div key={item.id} className={css.filter_item}>
                <p className={css.label}>{item.label}</p>
                <DateRangePickerInput
                  from={item.from}
                  to={item.to}
                  onChange={item.onChange}
                  placeholder={item.placeholder}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default Filters;
