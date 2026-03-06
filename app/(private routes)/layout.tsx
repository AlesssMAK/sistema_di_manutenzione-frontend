import Header from '@/components/Header/Header';

type PrivateRoutesLayoutProps = {
  children: React.ReactNode;
};

export default function PrivateRoutesLayout({
  children,
}: PrivateRoutesLayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
