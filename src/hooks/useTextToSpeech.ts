import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useTextToSpeech = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const speak = async (text: string, voice: string = 'alloy') => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice }
      });

      if (error) {
        console.error('Supabase TTS Error:', error);
        throw new Error(`TTS service error: ${error.message}`);
      }

      if (data?.audioContent) {
        // Convert base64 to blob and play
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Handle iOS Safari audio restrictions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          URL.revokeObjectURL(audioUrl);
          throw new Error('Audio playback failed - check your device audio settings');
        };
        
        try {
          await audio.play();
        } catch (playError) {
          console.error('Audio play error:', playError);
          URL.revokeObjectURL(audioUrl);
          
          if (isIOS && playError.name === 'NotAllowedError') {
            throw new Error('Audio blocked - tap to enable speech in browser settings');
          } else {
            throw new Error(`Audio playback failed: ${playError.message}`);
          }
        }
      } else {
        throw new Error('No audio content received from TTS service');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      toast({
        title: 'Speech Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { speak, isLoading };
};