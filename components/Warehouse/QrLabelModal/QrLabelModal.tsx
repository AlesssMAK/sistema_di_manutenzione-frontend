'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import css from './QrLabelModal.module.css';

interface QrLabelModalProps {
  code: string;
  name: string;
  onClose: () => void;
}

const QrLabelModal = ({ code, name, onClose }: QrLabelModalProps) => {
  const t = useTranslations('WarehousePage.qr');
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(code, { width: 256, margin: 1 })
      .then(setDataUrl)
      .catch(() => {});
  }, [code]);

  // Print a single label in its own window — keeps the app's layout and
  // print styles out of the way. Content is added via the DOM (no HTML
  // string interpolation) so item names/codes can't inject markup.
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
    img.style.width = '256px';
    const nm = doc.createElement('div');
    nm.textContent = name;
    nm.style.cssText = 'font-size:18px;font-weight:600;margin-top:12px;';
    const cd = doc.createElement('div');
    cd.textContent = code;
    cd.style.cssText = 'font-size:14px;color:#555;margin-top:2px;';
    wrap.append(img, nm, cd);
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
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={code} className={css.qr} />
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

export default QrLabelModal;
