import React from 'react';
import { cn } from '@/lib/utils';
import gfAvatar from '@/assets/gf-avatar.png';
import maleAvatar from '@/assets/male-avatar.png';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  avatar?: string;
  aiGender?: 'male' | 'female';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  avatar,
  aiGender = 'female'
}) => {
  return (
    <div className={cn(
      "flex gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gradient-to-br from-primary to-accent p-0.5">
          <div className="w-full h-full rounded-full overflow-hidden bg-white">
            <img 
              src={avatar || (aiGender === 'male' ? maleAvatar : gfAvatar)} 
              alt={aiGender === 'male' ? "AI Boyfriend Avatar" : "AI Girlfriend Avatar"} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      <div className={cn(
        "max-w-[70%] md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-message-user text-message-user-foreground rounded-br-md" 
          : "bg-message-ai text-message-ai-foreground border border-border rounded-bl-md"
      )}>
        <p className="text-sm leading-relaxed">{message}</p>
        <p className={cn(
          "text-xs mt-1",
          isUser ? "text-message-user-foreground/70" : "text-muted-foreground"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium text-sm">
          You
        </div>
      )}
    </div>
  );
};