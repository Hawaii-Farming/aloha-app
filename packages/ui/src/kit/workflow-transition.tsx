'use client';

import { useState } from 'react';

import { Button } from '../shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../shadcn/dialog';
import { Trans } from './trans';

interface WorkflowTransitionButtonsProps {
  currentStatus: string;
  transitions: Record<string, string[]>;
  states: Record<string, { label: string; color: string }>;
  onTransition: (newStatus: string) => void;
  disabled?: boolean;
}

export function WorkflowTransitionButtons({
  currentStatus,
  transitions,
  states,
  onTransition,
  disabled,
}: WorkflowTransitionButtonsProps) {
  const validNextStates = transitions[currentStatus] ?? [];
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  if (validNextStates.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2" data-test="workflow-transitions">
      {validNextStates.map((nextState) => (
        <Button
          key={nextState}
          variant="outline"
          disabled={disabled}
          onClick={() => setConfirmStatus(nextState)}
        >
          <Trans
            i18nKey={states[nextState]?.label ?? nextState}
            defaults={states[nextState]?.label ?? nextState}
          />
        </Button>
      ))}

      <Dialog
        open={!!confirmStatus}
        onOpenChange={(open) => {
          if (!open) setConfirmStatus(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey="common:confirmStatusChange"
                defaults="Confirm Status Change"
              />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="common:confirmTransitionTo"
                defaults={`Change status to ${confirmStatus ? (states[confirmStatus]?.label ?? confirmStatus) : ''}?`}
                values={{
                  status: confirmStatus
                    ? (states[confirmStatus]?.label ?? confirmStatus)
                    : '',
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatus(null)}>
              <Trans i18nKey="common:cancel" defaults="Cancel" />
            </Button>
            <Button
              onClick={() => {
                if (confirmStatus) {
                  onTransition(confirmStatus);
                }
                setConfirmStatus(null);
              }}
            >
              <Trans i18nKey="common:confirm" defaults="Confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
