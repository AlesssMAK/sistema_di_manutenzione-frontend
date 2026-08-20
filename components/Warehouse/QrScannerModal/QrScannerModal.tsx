'use client';

import { useEffect, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import css from './QrScannerModal.module.css';

interface QrScannerModalProps {
  /** Fired once with the decoded text (the item SKU). */
  onScan: (code: string) => void;
  onClose: () => void;
}

const REGION_ID = 'wh-qr-reader';

const QrScannerModal = ({ onScan, onClose }: QrScannerModalProps) => {
  const t = useTranslations('WarehousePage.qr');
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const doneRef = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    let started = false;

    (async () => {
      // Dynamic import: the library touches the DOM, so keep it off the
      // server render path.
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelled) return;
      scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            // Wide scan box so 1D barcodes (EAN/UPC/Code128) read as well
            // as QR. All supported formats are enabled by default.
            qrbox: (viewfinderWidth: number) => {
              const width = Math.min(Math.max(viewfinderWidth - 24, 160), 300);
              return { width, height: Math.round(width * 0.6) };
            },
          },
          (decoded) => {
            if (doneRef.current) return;
            doneRef.current = true;
            onScanRef.current(decoded);
          },
          () => {}
        );
        started = true;
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (scanner && started) {
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <Modal onClose={onClose}>
      <div className={css.wrap}>
        <h2 className={`${css.title} title`}>{t('scanTitle')}</h2>
        {error ? (
          <p className={css.error}>{t('cameraError')}</p>
        ) : (
          <p className={css.hint}>{t('scanHint')}</p>
        )}
        <div id={REGION_ID} className={css.reader} />
      </div>
    </Modal>
  );
};

export default QrScannerModal;
