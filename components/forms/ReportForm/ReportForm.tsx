'use client';

import { useTranslations } from 'next-intl';
import css from './ReportForm.module.css';
import Button from '@/components/UI/Button/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';
import { generateId } from '@/lib/api/generate';

const ReportForm = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [generatedId, setGeneratedId] = useState<string>('');
  const t = useTranslations('ReportForm');
  const { user } = useAuthStore();
  const now = new Date();
  const date = now.toLocaleDateString('it-IT');

  useEffect(() => {
    const getId = async () => {
      const reportId = await generateId();
      setGeneratedId(reportId);
    };
    getId();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <form className={css.form}>
      <div className={css.report_form_container}>
        <ul className={css.info_list}>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('reportId')}</h3>
            <p className={css.info_text}>{generatedId}</p>
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('operator')}</h3>
            <p className={css.info_text}>{user?.fullName}</p>
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('date')}</h3>
            <p className={css.info_text}>{date}</p>
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('time')}</h3>
            <p className={css.info_text}>{currentTime}</p>
          </li>
        </ul>
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('plantMachine')}</h3>
        </div>
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('plantSection')}</h3>
        </div>

        {/* type */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('type')}</h3>
          <div className={css.form_item_type}>
            <label className={css.type_label}>
              <input
                type="radio"
                name="status"
                className={css.type_input}
                value="produzione"
              />
              <p className={css.type_text}>{t('production')}</p>
            </label>
            <label className={css.type_label}>
              <input
                type="radio"
                name="status"
                className={css.type_input}
                value="sicurezza"
              />
              <p className={css.type_text}>{t('safety')}</p>
            </label>
          </div>
        </div>
        {/* Note e Descrizione */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('notesDescription')}</h3>
          <label>
            <textarea
              name="name"
              required
              className={css.textarea}
              placeholder={t('describeIssue')}
            />
          </label>
        </div>
        {/* Immagini */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('images')}</h3>
          <label className={css.upload_label}>
            <input type="file" className={css.upload_input} accept="image/*" />
            <div className={css.upload_text_container}>
              <svg width="32" height="32" className={css.upload_icon}>
                <use href="/sprite.svg#load"></use>
              </svg>
              <p className={css.upload_text}>{t('clickToUpload')}</p>
            </div>
          </label>
        </div>
      </div>
      <div className={css.btn_container}>
        <Button type="button" className="button button--white" width="100%">
          {t('cancel')}
        </Button>
        <Button type="submit" className="button button--blue" width="100%">
          {t('sendReport')}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
