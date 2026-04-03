import { X, Zap } from 'lucide-react';

import { Button } from '@aloha/ui/button';

import { useAiChat } from '~/components/ai/ai-chat-provider';

export function AiChatButton() {
  const { open, setOpen } = useAiChat();

  return (
    <Button
      size="icon"
      variant="outline"
      className="size-8 rounded-full text-muted-foreground"
      onClick={() => setOpen(!open)}
      aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      data-test="ai-chat-button"
    >
      {open ? <X className="size-4" /> : <Zap className="size-4" />}
    </Button>
  );
}
