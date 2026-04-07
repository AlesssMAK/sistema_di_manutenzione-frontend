import css from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

const AdminLayout = ({ children, sidebar }: AdminLayoutProps) => {
  return (
    <section className={css.layout}>
      <div className="container">
        <div className={css.layout_container}>
          <aside className={css.sidebar}>{sidebar}</aside>
          <div className={css.admin_container}>{children}</div>
        </div>
      </div>
    </section>
  );
};

export default AdminLayout;
