import { useMemo, useRef, useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { Button } from '@aloha/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';

import { useAiChat } from '~/components/ai/ai-chat-provider';

export function AiChatPanel() {
  const { open, setOpen, context } = useAiChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        body: { context },
      }),
    [context],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isStreaming = status === 'streaming';

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex h-full w-3/4 flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto p-4"
          data-test="ai-chat-messages"
        >
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
              Ask me anything about your current task.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const textContent = message.parts
                  .filter(
                    (p): p is Extract<typeof p, { type: 'text' }> =>
                      p.type === 'text',
                  )
                  .map((p) => p.text)
                  .join('');

                return (
                  <div key={message.id} className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <div
                      className={
                        message.role === 'user'
                          ? 'bg-muted rounded-lg p-3 text-sm'
                          : 'text-sm leading-relaxed'
                      }
                    >
                      {textContent || (isStreaming ? '...' : '')}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error ? (
          <div className="text-destructive border-destructive/20 border-t px-4 py-2 text-sm">
            {error.message}
          </div>
        ) : null}

        {isStreaming ? (
          <div className="text-muted-foreground px-4 py-1 text-xs">
            Assistant is typing...
          </div>
        ) : null}

        <div className="border-t p-4" data-test="ai-chat-input">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!input.trim() || isStreaming}
              data-test="ai-chat-send"
            >
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
