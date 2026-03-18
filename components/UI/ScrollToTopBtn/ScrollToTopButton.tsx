'use client';

import { useEffect, useRef, useState } from 'react';
import css from './ScrollToTopButton.module.css';

type Props = {
  showAfter?: number;
};

const clamp = (n: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, n));
};

const ScrollToTopButton = ({ showAfter = 400 }: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const maxScrollRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const getMaxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const update = () => {
      const scrollTop = window.scrollY || 0;
      const currentMaxScroll = getMaxScroll();

      const EPS = 2;
      const isAtBottom = scrollTop >= currentMaxScroll - EPS;

      if (currentMaxScroll > maxScrollRef.current) {
        maxScrollRef.current = currentMaxScroll;
      } else if (isAtBottom) {
        maxScrollRef.current = currentMaxScroll;
      }

      const denom = maxScrollRef.current || 1;
      const p = denom > 0 ? scrollTop / denom : 0;

      setProgress(isAtBottom ? 1 : clamp(p, 0, 1));
      setIsVisible(scrollTop > showAfter);

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const ro = new ResizeObserver(() => update());
    ro.observe(document.documentElement);

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [showAfter]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    e.currentTarget.blur();
  };

  const MIN_SCALE = 0.48;
  const fillScale = MIN_SCALE + progress * (1 - MIN_SCALE);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${css.btn} ${isVisible ? css.show : ''}`}
      aria-label="back to top"
      title="Top"
      style={{ ['--fillScale' as string]: fillScale.toString() }}
    >
      <svg width="20" height="20" className={css.icon} aria-hidden="true">
        <use href="/sprite.svg#arrow_back_ios_new" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
