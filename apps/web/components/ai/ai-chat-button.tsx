import { MessageCircle, X } from 'lucide-react';

import { Button } from '@aloha/ui/button';

import { useAiChat } from '~/components/ai/ai-chat-provider';

export function AiChatButton() {
  const { open, setOpen } = useAiChat();

  return (
    <Button
      size="icon"
      className="fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg"
      onClick={() => setOpen(!open)}
      aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      data-test="ai-chat-button"
    >
      {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
    </Button>
  );
}
