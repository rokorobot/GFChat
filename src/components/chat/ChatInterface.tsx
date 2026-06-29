import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { RotateCcw, MessageCircle } from 'lucide-react';
import { companionClient, ChatMessage } from '@/backend/companionClient';
import { AvatarStage } from '@/avatar/AvatarStage';
import { AvatarState, AvatarEmotion } from '@/avatar/avatar';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onFeedbackClick?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onFeedbackClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAiMessageId, setLastAiMessageId] = useState<string>('');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>('neutral');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousGenderRef = useRef<'male' | 'female'>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { speak, isLoading: isSpeaking } = useTextToSpeech();
  const { settings, getCurrentPersonalityText } = useSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Synchronize avatar state based on system speech state
  useEffect(() => {
    if (isSpeaking) {
      setAvatarState('speaking');
    } else if (isTyping) {
      setAvatarState('thinking');
    } else {
      setAvatarState('idle');
    }
  }, [isSpeaking, isTyping]);

  // Map selected companion personality to avatar emotions
  useEffect(() => {
    if (!settings) return;
    const currentPreset = settings.currentPersonality;
    if (currentPreset === 'Playful') {
      setAvatarEmotion('playful');
    } else if (currentPreset === 'Sweet') {
      setAvatarEmotion('sweet');
    } else if (currentPreset === 'Romantic') {
      setAvatarEmotion('romantic');
    } else if (currentPreset === 'Motivator') {
      setAvatarEmotion('happy');
    } else {
      setAvatarEmotion('neutral');
    }
  }, [settings?.currentPersonality]);

  // Reset chat when AI gender changes
  useEffect(() => {
    if (!isLoading && previousGenderRef.current && previousGenderRef.current !== settings?.aiGender) {
      handleResetChat();
    }
    previousGenderRef.current = settings?.aiGender;
  }, [settings?.aiGender, isLoading]);

  // Auto-speak new AI responses
  useEffect(() => {
    if (isLoading || !settings?.voiceOutput) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUser && lastMessage.id !== lastAiMessageId) {
      setLastAiMessageId(lastMessage.id);
      speak(lastMessage.content, settings.voiceType || 'alloy');
    }
  }, [messages, isLoading, lastAiMessageId, speak, settings?.voiceOutput, settings?.voiceType]);

  // Load existing messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      try {
        const existingMessages = await companionClient.loadMessages(user.id);

        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
        } else {
          // Send initial welcome message if no messages exist
          const welcomeMessage = `Hi! I'm your AI ${settings?.aiGender === 'male' ? 'boyfriend' : 'girlfriend'} and I'm so excited to chat with you! 💕 How are you doing today?`;
          const savedMsg = await companionClient.saveMessage(user.id, welcomeMessage, false);
          setMessages([savedMsg]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user, settings?.aiGender]);

  // Add safety check for settings (moved below hooks to satisfy rules of hooks)
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-chat">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    // Transition avatar state to listening/thinking
    setAvatarState('listening');

    const userMessage = await companionClient.saveMessage(user.id, content, true);
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get conversation history for AI context
      const history: ChatMessage[] = messages.map(m => ({
        id: m.id,
        content: m.content,
        isUser: m.isUser,
        timestamp: m.timestamp
      }));

      const replyContent = await companionClient.getAIResponse(
        user.id,
        content,
        history,
        getCurrentPersonalityText()
      );

      const aiResponse = await companionClient.saveMessage(user.id, replyContent, false);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Connection Error",
        description: "I'm having trouble connecting right now. Please try again!",
        variant: "destructive",
      });
      
      const errorMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment! 💕";
      const errorResponse = await companionClient.saveMessage(user.id, errorMsg, false);
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = async () => {
    if (!user) return;

    try {
      await companionClient.clearMessages(user.id);
      setMessages([]);
      setLastAiMessageId('');

      toast({
        title: "Chat Reset",
        description: "Your conversation has been cleared.",
      });

      // Send new welcome message after a brief delay
      setTimeout(async () => {
        const welcomeMessage = `Hi! I'm your AI ${settings.aiGender === 'male' ? 'boyfriend' : 'girlfriend'} and I'm so excited to chat with you! 💕 How are you doing today?`;
        const savedMsg = await companionClient.saveMessage(user.id, welcomeMessage, false);
        setMessages([savedMsg]);
      }, 500);

    } catch (error) {
      console.error('Error resetting chat:', error);
      toast({
        title: "Error",
        description: "Failed to reset chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-chat">
      {/* Header with Speaking Avatar Stage */}
      <div className="flex flex-col items-center p-4 border-b border-border bg-card/80 backdrop-blur-sm relative">
        <AvatarStage
          gender={settings.aiGender}
          state={avatarState}
          emotion={avatarEmotion}
          providerId="static-speaking"
        />
        
        {/* Reset button positioned at lower right corner */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetChat}
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          title="Reset Chat"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        {/* Feedback button positioned at lower left corner */}
        {onFeedbackClick && (
          <Button
            variant="outline"
            size="icon"
            onClick={onFeedbackClick}
            className="absolute bottom-4 left-4 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            title="Send Feedback"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 flex justify-center">
        <div className="w-full max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading your conversation...</div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
                avatar={message.isUser ? "👤" : undefined}
                aiGender={settings.aiGender}
              />
            ))}
            <TypingIndicator isVisible={isTyping} />
            <div ref={messagesEndRef} />
          </>
        )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        placeholder="Share your thoughts..."
        disabled={isTyping || isLoading}
      />
    </div>
  );
};