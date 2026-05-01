import type { OrderStatus } from '@/app/actions/orders';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft:       { label: 'Draft',       variant: 'secondary' },
  submitted:   { label: 'Submitted',   variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'default' },
  in_review:   { label: 'In Review',   variant: 'default' },
  delivered:   { label: 'Delivered',   variant: 'outline' },
  cancelled:   { label: 'Cancelled',   variant: 'destructive' },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft:       'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  submitted:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  in_review:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  delivered:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' };
  const color = STATUS_COLORS[status] ?? '';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className ?? ''}`}
    >
      {config.label}
    </span>
  );
}
