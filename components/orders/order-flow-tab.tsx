'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, ChevronRight, UploadCloud } from 'lucide-react';
import { updateOrderStatus, updateOrderDueDate, updateOrderWorkAssets, type Order, sendOrderReviewEmail, sendOrderPaymentRequestEmail } from '@/app/actions/orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OrderFlowTabProps {
  order: Order;
  isAdmin: boolean;
  isCustomer: boolean;
}

export function OrderFlowTab({ order, isAdmin, isCustomer }: OrderFlowTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [isDueDialogOpen, setIsDueDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Form states
  const [dueDate, setDueDate] = useState(order.deadline?.slice(0, 10) || '');
  const [workUrls, setWorkUrls] = useState(order.work_assets?.urls?.join('\n') || '');

  const statuses = [
    { id: 'submitted', label: 'Submitted' },
    { id: 'payment_request', label: 'Payment Request' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'in_review', label: 'In Review' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const currentStatusIndex = statuses.findIndex((s) => s.id === order.status);
  const flowIndex = currentStatusIndex === -1 ? 0 : currentStatusIndex; // Draft maps to 0 for simplicity

  const handleSendPaymentRequest = async () => {
    setLoading(true);
    setError('');
    const res = await updateOrderStatus(order.id, 'payment_request');
    if (res.success) {
      await sendOrderPaymentRequestEmail(order);
      router.refresh();
    } else {
      setError(res.error || 'Failed to update status');
    }
    setLoading(false);
  };

  const handleStartProgress = async () => {
    if (!dueDate) {
      setError('Please set a due date');
      return;
    }
    setLoading(true);
    setError('');
    const res = await updateOrderDueDate(order.id, dueDate);
    if (res.success) {
      const statusRes = await updateOrderStatus(order.id, 'in_progress');
      if (statusRes.success) {
        setIsDueDialogOpen(false);
        router.refresh();
      } else {
        setError(statusRes.error || 'Failed to update status');
      }
    } else {
      setError(res.error || 'Failed to set due date');
    }
    setLoading(false);
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    setError('');
    
    const urls = workUrls.split('\n').map(u => u.trim()).filter(Boolean);
    
    const assetsRes = await updateOrderWorkAssets(order.id, { keys: [], urls });
    if (assetsRes.success) {
      const statusRes = await updateOrderStatus(order.id, 'in_review');
      if (statusRes.success) {
        await sendOrderReviewEmail(order);
        setIsReviewDialogOpen(false);
        router.refresh();
      } else {
        setError(statusRes.error || 'Failed to update status');
      }
    } else {
      setError(assetsRes.error || 'Failed to update work assets');
    }
    setLoading(false);
  };

  const handleApproveWork = async () => {
    setLoading(true);
    setError('');
    const res = await updateOrderStatus(order.id, 'delivered');
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || 'Failed to update status');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Stepper UI */}
      <div className="flex items-center w-full max-w-3xl mx-auto py-4">
        {statuses.map((status, idx) => {
          const isCompleted = idx < flowIndex;
          const isCurrent = idx === flowIndex;
          return (
            <div key={status.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-background border-primary text-primary'
                      : 'bg-muted border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{idx + 1}</span>}
                </div>
                <span
                  className={`text-xs font-medium absolute top-12 whitespace-nowrap ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {status.label}
                </span>
              </div>
              {idx < statuses.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-10">
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-center gap-2 mb-4 max-w-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex justify-center mt-6">
            {order.status === 'submitted' && (
              <Button size="lg" onClick={handleSendPaymentRequest} disabled={loading}>
                Send Payment Request
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {order.status === 'payment_request' && (
              <Button size="lg" onClick={() => setIsDueDialogOpen(true)} disabled={loading}>
                Mark as Paid & Start Progress
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {order.status === 'in_progress' && (
              <Button size="lg" onClick={() => setIsReviewDialogOpen(true)} disabled={loading}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Submit Work for Review
              </Button>
            )}

            {order.status === 'in_review' && (
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Waiting for customer approval...
              </p>
            )}

            {order.status === 'delivered' && (
              <p className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Order is complete.
              </p>
            )}
          </div>
        )}

        {/* Customer Actions */}
        {isCustomer && !isAdmin && (
          <div className="flex justify-center mt-6">
            {order.status === 'in_review' ? (
              <Button size="lg" onClick={handleApproveWork} disabled={loading}>
                Approve Work & Finish
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            ) : order.status === 'delivered' ? (
              <p className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Order is complete.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Waiting for the next step...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Due Date Dialog */}
      <Dialog open={isDueDialogOpen} onOpenChange={setIsDueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Project Due Date</DialogTitle>
            <DialogDescription>
              When will this project be delivered? The customer will see this deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDueDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleStartProgress} disabled={loading || !dueDate}>
              Start Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Work for Review</DialogTitle>
            <DialogDescription>
              Provide URLs to the final deliverables. A notification email will be sent to the customer to review and approve the work.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work-urls">Work Asset URLs (One per line)</Label>
              <textarea
                id="work-urls"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://link-to-files.com/..."
                value={workUrls}
                onChange={(e) => setWorkUrls(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForReview} disabled={loading || !workUrls.trim()}>
              Submit Work
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
