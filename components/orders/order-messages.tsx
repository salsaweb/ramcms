'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createOrderMessage, type OrderMessage } from '@/app/actions/order-messages';
import { Send } from 'lucide-react';


interface OrderMessagesProps {
  orderId: string;
  initialMessages: OrderMessage[];
  currentUserId: string;
}

export function OrderMessages({ orderId, initialMessages, currentUserId }: OrderMessagesProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<OrderMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('message', newMessage);

    // Optimistic UI update
    const tempMsg: OrderMessage = {
      id: Math.random().toString(),
      order_id: orderId,
      message: newMessage,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      sender: { name: 'Me', avatar_url: null }
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    const res = await createOrderMessage(formData);
    setIsSubmitting(false);

    if (res.success) {
      router.refresh();
    } else {
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Failed to send message.');
    }
  };

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card h-[500px]">
      <div className="bg-muted px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Messages</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-10">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {msg.sender?.name ? msg.sender.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isMe ? 'You' : msg.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-background border-t">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-muted/50 focus-visible:ring-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim() || isSubmitting}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
