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
  return (
    <div className={css.filters_container}>
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
  );
};

export default Filters;
