/**
 * Workflow Automation Scaffold
 *
 * This module demonstrates how to build AI-powered workflow automation
 * using the AI SDK's generateText with tools. Consumer projects extend
 * this pattern for domain-specific automation.
 *
 * Example use cases:
 * - Auto-approve purchase orders under $500
 * - Schedule alerts when inventory drops below threshold
 * - Suggest next workflow action based on record data
 *
 * Usage:
 *   import { createWorkflowAgent } from '~/lib/ai/workflow-automation.server';
 *   const agent = createWorkflowAgent({
 *     tools: { approveRecord, sendAlert },
 *     systemPrompt: 'You manage procurement approvals...',
 *   });
 *   const result = await agent.evaluate('Should PO-1234 be auto-approved?');
 */
import { anthropic } from '@ai-sdk/anthropic';
import type { ToolSet } from 'ai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

interface WorkflowAgentConfig {
  tools: ToolSet;
  systemPrompt: string;
  model?: string;
}

export function createWorkflowAgent(config: WorkflowAgentConfig) {
  return {
    async evaluate(prompt: string) {
      const result = await generateText({
        model: anthropic(config.model ?? 'claude-sonnet-4-20250514'),
        system: config.systemPrompt,
        tools: config.tools,
        prompt,
      });

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    },
  };
}

// Example tool definition (for documentation purposes):
const approvalSchema = z.object({
  recordId: z.string().describe('The record ID to approve'),
  reason: z.string().describe('Reason for approval'),
});

export const exampleApprovalTool = tool({
  description: 'Approve a workflow record and advance its status',
  inputSchema: approvalSchema,
  execute: async ({ recordId, reason }: z.infer<typeof approvalSchema>) => {
    // Consumer implements: update record status in Supabase
    // e.g., await supabase
    //   .from('purchase_orders')
    //   .update({ status: 'approved', approved_reason: reason })
    //   .eq('id', recordId);
    return { success: true, recordId, reason };
  },
});
