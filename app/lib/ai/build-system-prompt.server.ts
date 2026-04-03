import type { AiPageContext } from './ai-context';

export function buildSystemPrompt(context?: AiPageContext): string {
  const parts = [
    'You are a helpful assistant for an enterprise application.',
    "Be concise and practical. Focus on the user's current task.",
  ];

  if (context?.orgName) {
    parts.push(`Organization: ${context.orgName}.`);
  }
  if (context?.module) {
    parts.push(`Module: ${context.module}.`);
  }
  if (context?.subModule) {
    parts.push(`Sub-module: ${context.subModule}.`);
  }
  if (context?.pageType) {
    parts.push(`Page type: ${context.pageType}.`);
  }

  return parts.join('\n');
}
