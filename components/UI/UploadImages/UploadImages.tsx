import css from './UploadImages.module.css';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import Button from '../Button/Button';

interface UploadImagesProps {
  /** Controlled list of picked files. */
  value: File[];
  onChange: (files: File[]) => void;
  max?: number;
}

export const UploadImages = ({
  value,
  onChange,
  max = 5,
}: UploadImagesProps) => {
  const t = useTranslations('ReportForm');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (value.length + files.length > max) {
      toast(t('maxImages'));
      return;
    }

    onChange([...value, ...files]);
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

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
        {value.map((file, index) => (
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
        {value.length} / {max}
      </p>
    </>
  );
};
