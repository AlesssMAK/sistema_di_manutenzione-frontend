'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import css from './LanguageSwitcher.module.css';

export default function LanguageToggleButton() {
  const router = useRouter();
  const [locale, setLocale] = useState('it');

  useEffect(() => {
    const stored = localStorage.getItem('locale') || 'it';
    setLocale(stored);
  }, []);

  const toggleLocale = () => {
    const newLocale = locale === 'it' ? 'en' : 'it';
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    document.cookie = `locale=${newLocale}; path=/;`;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('localeChange'));
    }

    router.refresh();
  };

  return (
    <button
      className={css.langButton}
      onClick={toggleLocale}
      aria-label="Switch language"
    >
      {locale === 'IT' ? 'UA' : 'EN'}
    </button>
  );
}
