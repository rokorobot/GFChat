import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { RotateCcw, MessageCircle, Settings as SettingsIcon, LogOut as LogOutIcon } from 'lucide-react';
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
  const [isUserInputting, setIsUserInputting] = useState(false);
  const isInitializingRef = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousGenderRef = useRef<'male' | 'female'>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { speak, stop, isPlaying: isSpeaking } = useTextToSpeech();
  const { settings, getCurrentPersonalityText } = useSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Synchronize avatar state based on chat lifecycle priorities
  useEffect(() => {
    if (isSpeaking) {
      setAvatarState('speaking');
    } else if (isTyping) {
      setAvatarState('thinking');
    } else if (isUserInputting) {
      setAvatarState('listening');
    } else {
      setAvatarState('idle');
    }
  }, [isSpeaking, isTyping, isUserInputting]);

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
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        const existingMessages = await companionClient.loadMessages(user.id);

        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages);
          
          // Prevent auto-speaking old historical responses on initial load
          const lastAiMsg = [...existingMessages].reverse().find(m => !m.isUser);
          if (lastAiMsg) {
            setLastAiMessageId(lastAiMsg.id);
          }
        } else {
          // Double-check one more time that messages list is truly empty before writing new welcome message
          const doubleCheck = await companionClient.loadMessages(user.id);
          if (doubleCheck.length === 0) {
            const welcomeMessage = `Hi! I'm your AI ${settings?.aiGender === 'male' ? 'boyfriend' : 'girlfriend'} and I'm so excited to chat with you! 💕 How are you doing today?`;
            const savedMsg = await companionClient.saveMessage(user.id, welcomeMessage, false);
            setMessages([savedMsg]);
          } else {
            setMessages(doubleCheck);
            const lastAiMsg = [...doubleCheck].reverse().find(m => !m.isUser);
            if (lastAiMsg) {
              setLastAiMessageId(lastAiMsg.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user]);

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

  const handleInputChange = (value: string) => {
    setIsUserInputting(value.trim().length > 0);
  };

  const handleVoiceListeningChange = (listening: boolean) => {
    setIsUserInputting(listening);
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    // Interrupt any active speaking immediately when user responds
    stop();
    setIsUserInputting(false);

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

    // Stop speaking immediately on reset
    stop();

    try {
      await companionClient.clearMessages(user.id);
      setMessages([]);
      setLastAiMessageId('');

      // Create new welcome message immediately and atomically
      const welcomeMessage = `Hi! I'm your AI ${settings.aiGender === 'male' ? 'boyfriend' : 'girlfriend'} and I'm so excited to chat with you! 💕 How are you doing today?`;
      const savedMsg = await companionClient.saveMessage(user.id, welcomeMessage, false);
      setMessages([savedMsg]);

      toast({
        title: "Chat Reset",
        description: "Your conversation has been cleared.",
      });

    } catch (error) {
      console.error('Error resetting chat:', error);
      toast({
        title: "Error",
        description: "Failed to reset chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    stop();
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-gradient-chat overflow-hidden lg:flex-row flex-col">
      
      {/* LEFT/CENTER CONVERSATION ZONE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-border/20">
        
        {/* Navigation bar with settings and logout */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">GF.Chat</span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/settings')}
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full lg:hidden">
              {settings.aiGender === 'male' ? 'Alex' : 'Mia'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-full text-xs"
              title="Logout"
            >
              <LogOutIcon className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile-only avatar stage (hidden on desktop) */}
        <div className="flex flex-col items-center p-3 border-b border-border bg-card/85 backdrop-blur-sm lg:hidden relative w-full shrink-0">
          <AvatarStage
            gender={settings.aiGender}
            state={avatarState}
            emotion={avatarEmotion}
            providerId="static-speaking"
          />
          
          {/* Identity Info Details */}
          <div className="mt-0.5 text-center">
            <h2 className="text-sm font-bold text-foreground capitalize flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {settings.aiGender === 'male' ? 'Alex' : 'Mia'}
            </h2>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
              AI Girlfriend • {settings.currentPersonality || 'Sweet'} Preset
            </p>
          </div>
          
          {/* Reset button positioned at lower right corner */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetChat}
            className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            title="Reset Chat"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 flex justify-center w-full">
          <div className="w-full max-w-3xl">
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

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onInputChange={handleInputChange}
          onVoiceListeningChange={handleVoiceListeningChange}
          placeholder="Share your thoughts..."
          disabled={isTyping || isLoading}
        />
      </div>

      {/* RIGHT COMPANION DISPLAY PANEL (DESKTOP ONLY) */}
      <div className="hidden lg:flex w-80 xl:w-96 border-l border-border bg-card/45 backdrop-blur-md h-full flex-col items-center justify-between p-6 shrink-0 relative overflow-y-auto">
        <div className="w-full flex flex-col items-center flex-1 justify-center gap-6">
          <AvatarStage
            gender={settings.aiGender}
            state={avatarState}
            emotion={avatarEmotion}
            providerId="static-speaking"
          />

          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground capitalize flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {settings.aiGender === 'male' ? 'Alex' : 'Mia'}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              AI Girlfriend Preset
            </p>
          </div>

          {/* Quick Companion details card */}
          <div className="w-full bg-background/50 border border-border/60 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Personality</span>
              <span className="font-semibold text-primary">{settings.currentPersonality || 'Sweet'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Voice Engine</span>
              <span className="font-semibold text-foreground uppercase">{settings.voiceType || 'Nova'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Expression</span>
              <span className="font-semibold text-accent capitalize">{avatarEmotion}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-semibold text-muted-foreground">Local Fallback</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3 mt-6">
          <Button
            variant="outline"
            className="w-full border-border/80 hover:bg-background/80 flex items-center justify-center gap-2 rounded-full py-5 text-sm"
            onClick={handleResetChat}
          >
            <RotateCcw className="h-4 w-4" />
            Reset Conversation
          </Button>

          {onFeedbackClick && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground text-xs"
              onClick={onFeedbackClick}
            >
              <MessageCircle className="h-3.5 h-3.5 mr-1" />
              Send App Feedback
            </Button>
          )}
        </div>
      </div>
      
    </div>
  );
};