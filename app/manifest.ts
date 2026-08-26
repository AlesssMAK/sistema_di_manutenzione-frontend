import type { MetadataRoute } from 'next';

// Web app manifest — drives the "Install as app" dialog and the home
// screen / launcher icon. Without it the browser falls back to a
// generated letter tile. Icons must be square; icon-192/512 are the
// logo centred on a transparent square (see public/).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Syllert',
    short_name: 'Syllert',
    description: 'Sistema di Gestione Manutenzione e Comunicazioni',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e40af',
    // SVG icons first (crisp at any density); the PNGs stay as a
    // fallback for installers that don't render SVG manifest icons.
    icons: [
      {
        src: '/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
