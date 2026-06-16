'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import Button from '@/components/UI/Button/Button';
import css from './CreateFaultButton.module.css';

interface CreateFaultButtonProps {
  /** Optional click side-effect, e.g. closing a mobile menu after navigation. */
  onAfterClick?: () => void;
}

/**
 * Global entry-point to fault reporting. Renders for any authenticated role
 * except admin — admins don't operate machines, so they have no reason to
 * file a fault. Operators, managers, maintenance workers, and safety all
 * may notice problems and need a one-click path to report them.
 */
const CreateFaultButton = ({ onAfterClick }: CreateFaultButtonProps) => {
  const router = useRouter();
  const t = useTranslations('header');
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return null;
  // if (user.role === 'admin') return null;

  const handleClick = () => {
    router.push('/report-fault');
    onAfterClick?.();
  };

  return (
    <Button
      type="button"
      className={`${css.button} button button--blue`}
      onClick={handleClick}
    >
      <svg className={css.icon} width="16" height="16" aria-hidden="true">
        <use href="/sprite.svg#plus" />
      </svg>
      <span>{t('createFault')}</span>
    </Button>
  );
};

export default CreateFaultButton;
