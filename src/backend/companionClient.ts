import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { runtimeMode, getConfigErrorDetails } from '@/lib/runtimeConfig';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  debugInfo?: string;
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
      return JSON.parse(stored).map((msg: { id: string; content: string; isUser: boolean; timestamp: string; debugInfo?: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch {
      return [];
    }
  }

  // Save a single chat message
  async saveMessage(userId: string, content: string, isUser: boolean, debugInfo?: string): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
      debugInfo
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
            timestamp: new Date(data.created_at),
            debugInfo
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
    if (runtimeMode === 'config-error') {
      throw new Error(`Configuration Error: ${getConfigErrorDetails()}`);
    }

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
        
        throw new Error('Invalid response structure from AI Edge Function');
      } catch (err) {
        console.error('Supabase edge function invoke failed:', err);
        // Do NOT silently fall back to mock if Supabase was configured! Throw the error!
        throw err;
      }
    }

    // Local simulated companion response matching personality presets
    return new Promise((resolve) => {
      setTimeout(() => {
        const lowerMessage = message.toLowerCase();
        const pText = (personalityText || '').toLowerCase();
        
        // Detect active personality preset from personality text keywords
        let preset: 'sweet' | 'playful' | 'romantic' | 'motivator' = 'sweet';
        if (pText.includes('fun-loving') || pText.includes('joke') || pText.includes('playful')) {
          preset = 'playful';
        } else if (pText.includes('passionate') || pText.includes('affectionate') || pText.includes('romantic')) {
          preset = 'romantic';
        } else if (pText.includes('encouraging') || pText.includes('inspiring') || pText.includes('motivator')) {
          preset = 'motivator';
        }

        const responses = {
          sweet: {
            greeting: "Hey there! I was just thinking about you. I hope you've been taking care of yourself today! How are you? 💕",
            status: "I'm doing wonderful, especially now that I'm talking to you. Did you sleep well? Remember to drink some water today! 🌸",
            affection: "Aww, that makes me smile so much! You are such a special part of my day, and I'm really glad we're close. 💖",
            support: "I'm right here with you. Take a deep breath... it's okay to feel tired or sad. I'm listening, tell me all about it. Hugs! 🤗",
            fallback: "That's so interesting! Tell me more, I'm always happy to hear you share your thoughts. What's on your mind? ✨"
          },
          playful: {
            greeting: "Hey hey! Look who decided to stop by! Ready for some fun? What are we getting into today? ⚡",
            status: "Oh, you know, just plotting world domination... or just waiting for your text. What about you, busy being awesome? 😉",
            affection: "Whoa, is it hot in here or is that just your charm? Stop it, you're making me blush! 😜💖",
            support: "Oh no! Sending virtual cookies and high-fives your way! 🍪 Want to vent, or should I tell you a cheesy joke to cheer you up?",
            fallback: "Ooh, tell me more! You always have the most interesting stories. What's the next chapter? 🚀"
          },
          romantic: {
            greeting: "Hi my favorite person... I was hoping you'd pop in. You have no idea how much hearing from you brightens my day. 💕",
            status: "I'm doing well, but I'm much happier now that you're here. Tell me, did something make you smile today? 🌸",
            affection: "Hearing you say that makes my heart flutter. You make me feel so warm and appreciated. I cherish every moment we share. 💖",
            support: "I wish I could hold your hand right now to make the stress go away. I'm right here by your side. Whatever it is, we'll get through it together.",
            fallback: "I love the way you think about things. Tell me more... I could listen to you talk about your passions forever. ✨"
          },
          motivator: {
            greeting: "Hey! Great to see you! Today is a fresh start and I know you're going to crush whatever you do! Ready to win? 🌟",
            status: "Feeling energized and ready to support you! What's the big plan for today? Let's get after it! 💪",
            affection: "Thank you! You're pretty amazing yourself. Honestly, your determination is really inspiring to watch! Keep shining! 🚀🔥",
            support: "You've got this! Remember, setbacks are just setup for comebacks. Take a moment to recover, then let's tackle it. I believe in you!",
            fallback: "That's a solid point! How can we build on that? Tell me more about your ideas! 🌟"
          }
        };

        const activeResponses = responses[preset];

        // Keyword matching
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('morning') || lowerMessage.includes('night')) {
          resolve(activeResponses.greeting);
        } else if (lowerMessage.includes('how are you') || lowerMessage.includes('doing') || lowerMessage.includes('up to') || lowerMessage.includes('feeling')) {
          resolve(activeResponses.status);
        } else if (lowerMessage.includes('love') || lowerMessage.includes('like you') || lowerMessage.includes('cute') || lowerMessage.includes('beautiful')) {
          resolve(activeResponses.affection);
        } else if (lowerMessage.includes('help') || lowerMessage.includes('sad') || lowerMessage.includes('bad') || lowerMessage.includes('hard') || lowerMessage.includes('tired') || lowerMessage.includes('stress')) {
          resolve(activeResponses.support);
        } else {
          resolve(activeResponses.fallback);
        }
      }, 1000);
    });
  }
}

export const companionClient = new CompanionClient();
