import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useSettings } from '@/hooks/useSettings';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState('');
  const { settings } = useSettings();
  
  const { 
    isListening, 
    transcript, 
    isSupported: isVoiceSupported, 
    toggleListening 
  } = useVoiceInput({
    onResult: (finalTranscript) => {
      if (finalTranscript.trim()) {
        onSendMessage(finalTranscript.trim());
      }
    }
  });

  // Update input with voice transcript for visual feedback
  useEffect(() => {
    if (isListening && transcript) {
      setMessage(transcript);
    }
  }, [transcript, isListening]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={disabled || isListening}
        className={cn(
          "flex-1 rounded-full border-border/50 focus:border-primary transition-all duration-200",
          isListening && "border-red-400 bg-red-50 dark:bg-red-950/20"
        )}
      />
      
      {/* Voice Input Button - only show if voice input is enabled and supported */}
      {settings?.voiceInput && isVoiceSupported && (
        <Button
          onClick={toggleListening}
          disabled={disabled}
          size="icon"
          variant={isListening ? "destructive" : "outline"}
          className={cn(
            "rounded-full w-10 h-10 shrink-0 transition-all duration-200",
            "shadow-lg hover:shadow-xl hover:scale-105",
            isListening && "animate-pulse"
          )}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      )}
      
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled || isListening}
        size="icon"
        className={cn(
          "rounded-full w-10 h-10 shrink-0 transition-all duration-200",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-lg hover:shadow-xl hover:scale-105",
          (!message.trim() || isListening) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};