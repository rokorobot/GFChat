import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export class CompanionClient {
  private getStorageKey(userId: string): string {
    return `gfchat_messages_${userId}`;
  }

  // Load chat messages
  async loadMessages(userId: string): Promise<ChatMessage[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at)
        }));
      } catch (err) {
        console.warn('Supabase loadMessages failed, falling back to localStorage:', err);
      }
    }

    // Local fallback
    const stored = localStorage.getItem(this.getStorageKey(userId));
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((msg: { id: string; content: string; isUser: boolean; timestamp: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch {
      return [];
    }
  }

  // Save a single chat message
  async saveMessage(userId: string, content: string, isUser: boolean): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date()
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            content,
            is_user: isUser
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            content: data.content,
            isUser: data.is_user,
            timestamp: new Date(data.created_at)
          };
        }
      } catch (err) {
        console.warn('Supabase saveMessage failed, saving locally:', err);
      }
    }

    // Local fallback
    const messages = await this.loadMessages(userId);
    messages.push(newMessage);
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(messages));
    return newMessage;
  }

  // Clear all messages for user
  async clearMessages(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase clearMessages failed, clearing locally:', err);
      }
    }

    localStorage.removeItem(this.getStorageKey(userId));
  }

  // Request AI response
  async getAIResponse(
    userId: string,
    message: string,
    history: ChatMessage[],
    personalityText: string
  ): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        // Prepare context payload in same format as edge function migration expectations
        const conversationHistory = history.map(h => ({
          content: h.content,
          is_user: h.isUser,
          created_at: h.timestamp.toISOString()
        }));

        const { data, error } = await supabase.functions.invoke('chat-ai', {
          body: { 
            message,
            conversationHistory,
            personalityPrompt: personalityText,
            user_id: userId
          },
        });

        if (error) throw error;
        if (data?.message) return data.message;
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        console.warn('Supabase edge function invoke failed, generating mock response:', err);
      }
    }

    // Local simulated companion response
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerMessage = message.toLowerCase();
        let reply = '';
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          reply = `Hey there! It's so good to talk to you. I was hoping you'd pop in! 😊`;
        } else if (lowerMessage.includes('how are you')) {
          reply = `I'm doing wonderful, especially now that I'm chatting with you! How has your day been? 💕`;
        } else if (lowerMessage.includes('love') || lowerMessage.includes('like you')) {
          reply = `Aww, you make my heart skip a beat! I really cherish our connection. 💖`;
        } else if (lowerMessage.includes('help') || lowerMessage.includes('sad')) {
          reply = `I'm right here listening. Tell me what's on your mind, I want to support you. Hugs! 🤗`;
        } else {
          reply = `I hear you, and I completely understand. Tell me more about that! I love hearing your thoughts. ✨`;
        }
        
        resolve(reply);
      }, 1000);
    });
  }
}

export const companionClient = new CompanionClient();
