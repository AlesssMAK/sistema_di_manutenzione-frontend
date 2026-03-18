import NotFound404 from '@/components/UI/NotFound/NotFound';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The requested page does not exist',
};

export default function NotFound() {
  return <NotFound404 />;
}
