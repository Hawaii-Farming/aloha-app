import { useRef, useState } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import type { CustomCellRendererProps } from 'ag-grid-react';
import { Check, X } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Label } from '@aloha/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import { Textarea } from '@aloha/ui/textarea';

function TimeOffActionsRenderer(props: CustomCellRendererProps) {
  const status = props.data?.status as string | undefined;
  const id = props.data?.id as string | undefined;

  const [denialReason, setDenialReason] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const hasHandledCompletion = useRef(false);

  // Revalidate after fetcher completes
  /* eslint-disable react-hooks/refs */
  if (
    fetcher.state === 'idle' &&
    fetcher.data !== undefined &&
    !hasHandledCompletion.current
  ) {
    hasHandledCompletion.current = true;
    revalidator.revalidate();
  }
  /* eslint-enable react-hooks/refs */

  if (status !== 'pending' || !id) return null;

  const isSubmitting = fetcher.state !== 'idle';

  const handleApprove = () => {
    hasHandledCompletion.current = false;
    fetcher.submit(
      JSON.stringify({
        intent: 'bulk_transition',
        ids: [id],
        statusColumn: 'status',
        newStatus: 'approved',
        transitionFields: {
          reviewed_by: 'currentEmployee',
          reviewed_at: 'now',
        },
      }),
      { method: 'POST', encType: 'application/json' },
    );
  };

  const handleDenyConfirm = () => {
    hasHandledCompletion.current = false;
    fetcher.submit(
      JSON.stringify({
        intent: 'bulk_transition',
        ids: [id],
        statusColumn: 'status',
        newStatus: 'denied',
        transitionFields: {
          reviewed_by: 'currentEmployee',
          reviewed_at: 'now',
        },
        extraFields: { denial_reason: denialReason },
      }),
      { method: 'POST', encType: 'application/json' },
    );
    setPopoverOpen(false);
    setDenialReason('');
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={isSubmitting}
        onClick={handleApprove}
        data-test="approve-time-off"
      >
        <Check className="h-4 w-4" />
      </Button>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSubmitting}
            data-test="deny-time-off"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72" align="end">
          <div className="flex flex-col gap-3">
            <Label htmlFor="denial-reason">Denial Reason</Label>
            <Textarea
              id="denial-reason"
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Enter reason for denial..."
              rows={3}
              data-test="denial-reason-input"
            />
            <Button
              size="sm"
              variant="destructive"
              disabled={!denialReason.trim() || isSubmitting}
              onClick={handleDenyConfirm}
              data-test="confirm-deny"
            >
              Confirm Deny
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { TimeOffActionsRenderer };
