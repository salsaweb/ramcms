'use client';

import type { OrderStatus } from '@/app/actions/orders';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { updateOrderStatus, type Order } from '@/app/actions/orders';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { sendOrderPaymentRequestEmail } from '@/app/actions/orders';

interface OrderStatusUpdateBadgeProps {
    status: OrderStatus;
    order: Order;
}

export function OrderStatusUpdateBadge({ status, order }: OrderStatusUpdateBadgeProps) {

    const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'payment_request', label: 'Payment Request' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'in_review', label: 'In Review' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const [showStatusSelect, setShowStatusSelect] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus>(status);
    const [loading, setLoading] = useState(false);

    const handleStatusSelect = async () => {
        setLoading(true);

        if (newStatus === status) {
            setShowStatusSelect(false);
            setLoading(false);
            return;
        }

        const result = await updateOrderStatus(order.id, newStatus);

        if (result.success) {
            setShowStatusSelect(false);
            if (newStatus === 'payment_request') {
                await sendOrderPaymentRequestEmail(order);
            }
        }

        setLoading(false);
    };

    const handleCancelSelect = async () => {
        setLoading(false);
        setShowStatusSelect(false);
        setNewStatus(status);
    };

    if (showStatusSelect) {
        return (
            <div className="flex items-center gap-2">
                <select
                    name="status"
                    defaultValue={status}
                    className="w-full h-10 rounded-md border border-input bg-background px-1 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                >
                    {ORDER_STATUSES.map((os) => (
                        <option key={os.value} value={os.value}>{os.label}</option>
                    ))}
                </select>

                {newStatus !== status && (
                    <>
                        <Button
                            variant="default"
                            onClick={handleStatusSelect}
                            disabled={loading}
                            size="sm"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelSelect}
                            disabled={loading}
                            size="sm"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="cursor-pointer" onClick={() => setShowStatusSelect(true)}>
            <OrderStatusBadge status={status} />
        </div>
    );
}
