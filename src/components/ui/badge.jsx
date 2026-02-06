
import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'border border-stone-200 bg-stone-100 text-stone-900 hover:bg-stone-200',
    primary: 'border-0 bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border-0 bg-stone-200 text-stone-900 hover:bg-stone-300',
    destructive: 'border-0 bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-stone-300 text-stone-900 hover:bg-stone-100',
    success: 'border-0 bg-green-600 text-white hover:bg-green-700',
    warning: 'border-0 bg-amber-600 text-white hover:bg-amber-700',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge };
