import { useState, useEffect } from 'react';
import css from './UploadImages.module.css';
import toast from 'react-hot-toast';
import { UseFormSetValue } from 'react-hook-form';
import { ReportFormValues } from '@/types/faultType';
import { useTranslations } from 'next-intl';
import Button from '../Button/Button';

interface UploadImagesProps {
  setValue: UseFormSetValue<ReportFormValues>;
}

export const UploadImages = ({ setValue }: UploadImagesProps) => {
  const [preview, setPreview] = useState<File[]>([]);

  const t = useTranslations('ReportForm');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (preview.length + files.length > 5) {
      toast(t('maxImages'));
      return;
    }

    const updated = [...preview, ...files];

    setPreview(updated);
    setValue('img', updated, { shouldValidate: true });
  };

  const removeImage = (index: number) => {
    const updated = preview.filter((_, i) => i !== index);

    setPreview(updated);
    setValue('img', updated, { shouldValidate: true });
  };

  useEffect(() => {
    return () => {
      preview.forEach(file => URL.revokeObjectURL(file as any));
    };
  }, [preview]);

  return (
    <>
      <label className={css.upload_label}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className={css.upload_input}
        />
        <div className={css.upload_text_container}>
          <svg width="32" height="32" className={css.upload_icon}>
            <use href="/sprite.svg#load"></use>
          </svg>
          <p className={css.upload_text}>{t('clickToUpload')}</p>
        </div>
      </label>

      <div className={css.previewList}>
        {preview.map((file, index) => (
          <div key={index} className={css.previewItem}>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className={css.previewImage}
            />
            <Button
              type="button"
              className={`${css.removeBtn} button--blue`}
              onClick={() => removeImage(index)}
              width={22}
              height={22}
            >
              <svg width="16" height="16" className={css.close_icon}>
                <use href="/sprite.svg#close"></use>
              </svg>
            </Button>
          </div>
        ))}
      </div>

      <p className={css.counter}>
        {preview.length} / {5}
      </p>
    </>
  );
};
