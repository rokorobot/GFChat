import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium text-sm">
        AI
      </div>
      
      <div className="bg-message-ai text-message-ai-foreground border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
          </div>
          <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
        </div>
      </div>
    </div>
  );
};