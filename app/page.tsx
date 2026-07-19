import { Suspense } from 'react';
import Header from '@/components/Header/Header';
import HomeTabsClient from './HomeTabs.client';

export default function HomePage() {
  return (
    <>
      <Header />
      {/* HomeTabsClient reads the active tab from ?tab= via
          useSearchParams, which requires a Suspense boundary on an
          otherwise static route. */}
      <Suspense>
        <HomeTabsClient />
      </Suspense>
    </>
  );
}
