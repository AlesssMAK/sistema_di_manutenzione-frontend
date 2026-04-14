'use client';

import { useTranslations } from 'next-intl';
import Button from '../Button/Button';
import Input from '../Input/Input';
import SelectDropdown from '../SelectDropdown/SelectDropdown';
import css from './Filters.module.css';

interface FiltersTypes {
  id: string;
  label: string;
  type: 'input' | 'select';
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

export type FiltersItem = FiltersInput | FiltersSelect;

export interface FiltersProps {
  items: FiltersItem[];
}

const Filters = ({ items }: FiltersProps) => {
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
        <Button type="button" className="button button--white" height={36}>
          {t('clear')}
        </Button>
      </div>
      <div className={css.select_container}>
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

          return null;
        })}
      </div>
    </div>
  );
};

export default Filters;
