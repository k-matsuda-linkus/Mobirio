type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function AdminPageLayout({ title, subtitle, children, actions }: Props) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-black">{title}</h1>
          {subtitle && <p className="mt-[4px] text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-[8px]">{actions}</div>}
      </div>
      <div className="mt-[30px]">{children}</div>
    </div>
  );
}

export default AdminPageLayout;
