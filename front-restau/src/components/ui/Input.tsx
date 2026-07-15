import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
          error ? 'border-red-400' : 'border-slate-300',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  ),
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white',
          'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
          error ? 'border-red-400' : 'border-slate-300',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  ),
);
Select.displayName = 'Select';
