'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import css from './LanguageSwitcher.module.css';
import Button from '../UI/Button/Button';

const LanguageButton = () => {
  const [select, setSelect] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('locale') || 'it';
    setSelect(stored);
  }, []);

  const localeSelect = (item: string) => {
    localStorage.setItem('locale', item);
    document.cookie = `locale=${item}; path=/;`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('localeChange'));
    }

    router.refresh();
  };

  return (
    <ul className={css.btn_list}>
      <li className={css.btn_list_item}>
        <Button
          className={`${css.langButton} button button--white ${select === 'it' ? css.active : ''}`}
          onClick={() => {
            localeSelect('it');
            setSelect('it');
          }}
          aria-label="Switch language"
          height={28}
          width={54}
        >
          IT
        </Button>
      </li>
      <li className={css.btn_list_item}>
        <Button
          className={`${css.langButton} button button--white ${select === 'en' ? css.active : ''}`}
          onClick={() => {
            localeSelect('en');
            setSelect('en');
          }}
          aria-label="Switch language"
          height={28}
          width={54}
        >
          EN
        </Button>
      </li>
      <li className={css.btn_list_item}>
        <Button
          className={`${css.langButton} button button--white ${select === 'es' ? css.active : ''}`}
          onClick={() => {
            localeSelect('es');
            setSelect('es');
          }}
          aria-label="Switch language"
          height={28}
          width={54}
        >
          ES
        </Button>
      </li>
    </ul>
  );
};

export default LanguageButton;
