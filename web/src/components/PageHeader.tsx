import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-linha pb-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ctps">{title}</h1>
        {description && <p className="mt-1 text-sm text-tinta-suave">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
