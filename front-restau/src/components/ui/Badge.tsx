import { ReactNode } from 'react';
import clsx from 'clsx';

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: 'gray' | 'green' | 'red' | 'amber' | 'blue' }) {
  const colors = {
    gray: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color])}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function KpiCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'primary' | 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={clsx('flex h-12 w-12 items-center justify-center rounded-lg', colorMap[color])}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {trend && <p className="text-xs text-slate-400">{trend}</p>}
      </div>
    </Card>
  );
}
