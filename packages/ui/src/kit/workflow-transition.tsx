'use client';

import { useState } from 'react';

import { Check, Circle, X } from 'lucide-react';

import { Button } from '../shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../shadcn/dialog';
import { Label } from '../shadcn/label';
import { Textarea } from '../shadcn/textarea';
import { Trans } from './trans';

export interface WorkflowTransitionPrompt {
  field: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

interface WorkflowTransitionButtonsProps {
  currentStatus: string;
  transitions: Record<string, string[]>;
  states: Record<string, { label: string; color: string }>;
  onTransition: (
    newStatus: string,
    extraFields?: Record<string, unknown>,
  ) => void;
  /** Per-target-state prompt config. When the user clicks a transition
   *  whose target appears here, the confirm dialog renders a textarea
   *  and gates the Confirm button until a non-empty value is entered
   *  (when required, default true). */
  transitionPrompts?: Record<string, WorkflowTransitionPrompt>;
  disabled?: boolean;
}

export function WorkflowTransitionButtons({
  currentStatus,
  transitions,
  states,
  onTransition,
  transitionPrompts,
  disabled,
}: WorkflowTransitionButtonsProps) {
  const validNextStates = transitions[currentStatus] ?? [];
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');

  if (validNextStates.length === 0) {
    return null;
  }

  const activePrompt = confirmStatus
    ? transitionPrompts?.[confirmStatus]
    : undefined;
  const promptRequired = activePrompt?.required !== false;
  const confirmDisabled =
    !!activePrompt && promptRequired && !promptValue.trim();

  return (
    <div className="flex gap-2" data-test="workflow-transitions">
      {validNextStates.map((nextState) => {
        const color = states[nextState]?.color;
        const Icon =
          color === 'success' ? Check : color === 'destructive' ? X : Circle;
        const label = states[nextState]?.label ?? nextState;
        return (
          <Button
            key={nextState}
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={label}
            title={label}
            className="aspect-square h-9 w-9 rounded-full p-0 sm:aspect-auto sm:h-9 sm:w-auto sm:rounded-md sm:px-3"
            onClick={() => {
              setPromptValue('');
              setConfirmStatus(nextState);
            }}
          >
            <Icon className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">
              <Trans i18nKey={label} defaults={label} />
            </span>
          </Button>
        );
      })}

      <Dialog
        open={!!confirmStatus}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmStatus(null);
            setPromptValue('');
          }
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

          {activePrompt && (
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="workflow-transition-prompt" className="text-sm">
                {activePrompt.label}
                {promptRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="workflow-transition-prompt"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={activePrompt.placeholder}
                rows={3}
                data-test="workflow-transition-prompt"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmStatus(null);
                setPromptValue('');
              }}
            >
              <Trans i18nKey="common:cancel" defaults="Cancel" />
            </Button>
            <Button
              disabled={confirmDisabled}
              onClick={() => {
                if (!confirmStatus) return;
                const extra = activePrompt
                  ? { [activePrompt.field]: promptValue.trim() }
                  : undefined;
                onTransition(confirmStatus, extra);
                setConfirmStatus(null);
                setPromptValue('');
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
