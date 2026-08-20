'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import type { WarehouseLabelSettings } from '@/lib/api/systemSettings';
import css from './LabelModal.module.css';

type LabelFormat = 'qr' | 'barcode';
const STORAGE_KEY = 'warehouseLabelFormat';

interface LabelModalProps {
  code: string;
  name: string;
  /** Which formats the admin enabled. */
  formats: WarehouseLabelSettings;
  onClose: () => void;
}

const LabelModal = ({ code, name, formats, onClose }: LabelModalProps) => {
  const t = useTranslations('WarehousePage.qr');

  const available = useMemo<LabelFormat[]>(() => {
    const a: LabelFormat[] = [];
    if (formats.qr) a.push('qr');
    if (formats.barcode) a.push('barcode');
    return a.length ? a : ['qr'];
  }, [formats]);

  // Default to the technician's last choice when it's still enabled.
  const [format, setFormat] = useState<LabelFormat>(() => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (
      (saved === 'qr' && formats.qr) ||
      (saved === 'barcode' && formats.barcode)
    ) {
      return saved;
    }
    return available[0];
  });
  const [dataUrl, setDataUrl] = useState('');

  const chooseFormat = (f: LabelFormat) => {
    setFormat(f);
    try {
      localStorage.setItem(STORAGE_KEY, f);
    } catch {
      /* ignore storage errors (private mode) */
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (format === 'qr') {
          const url = await QRCode.toDataURL(code, { width: 256, margin: 1 });
          if (!cancelled) setDataUrl(url);
        } else {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, code, {
            format: 'CODE128',
            displayValue: true,
            height: 70,
            margin: 8,
            fontSize: 16,
          });
          if (!cancelled) setDataUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        if (!cancelled) setDataUrl('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [format, code]);

  // Print the label in its own window; content added via the DOM so the
  // item name/code can't inject markup.
  const handlePrint = () => {
    if (!dataUrl) return;
    const win = window.open('', '_blank', 'width=380,height=520');
    if (!win) return;
    const doc = win.document;
    doc.title = code;

    const wrap = doc.createElement('div');
    wrap.style.cssText =
      'text-align:center;font-family:sans-serif;padding:24px;';
    const img = doc.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '280px';
    const nm = doc.createElement('div');
    nm.textContent = name;
    nm.style.cssText = 'font-size:18px;font-weight:600;margin-top:12px;';
    wrap.append(img, nm);
    doc.body.append(wrap);
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  return (
    <Modal onClose={onClose}>
      <div className={css.wrap}>
        <h2 className={`${css.title} title`}>{t('labelTitle')}</h2>
        <div className={css.name}>{name}</div>
        <div className={css.code}>{code}</div>

        {available.length > 1 && (
          <div className={css.switcher}>
            {available.map((f) => (
              <button
                key={f}
                type="button"
                className={`${css.switchBtn} ${
                  format === f ? css.switchActive : ''
                }`}
                onClick={() => chooseFormat(f)}
              >
                {t(f === 'qr' ? 'formatQr' : 'formatBarcode')}
              </button>
            ))}
          </div>
        )}

        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={code}
            className={format === 'qr' ? css.qr : css.barcode}
          />
        )}

        <div className={css.actions}>
          <Button type="button" className="button button--white" onClick={onClose}>
            {t('close')}
          </Button>
          <Button
            type="button"
            className="button button--blue"
            onClick={handlePrint}
            disabled={!dataUrl}
          >
            {t('print')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LabelModal;
