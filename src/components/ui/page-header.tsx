import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-5 md:mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
