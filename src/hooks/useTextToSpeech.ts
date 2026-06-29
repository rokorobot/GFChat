import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useTextToSpeech = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stop = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  const speak = async (text: string, voice: string = 'alloy') => {
    if (!text.trim()) return;

    // Stop any currently playing audio before starting a new one
    stop();
    setIsLoading(true);

    try {
      let audioContentBase64 = '';

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text, voice }
        });

        if (error) {
          console.error('Supabase TTS Error:', error);
          throw new Error(`TTS service error: ${error.message}`);
        }
        audioContentBase64 = data?.audioContent || '';
      } else {
        // Local fallback: simulate TTS request delay, but no actual audio generation since Supabase is offline
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log(`[Mock TTS] Speaking: "${text}" with voice "${voice}"`);
        
        // Use browser Web Speech API SpeechSynthesis as a local fallback so the avatar actually speaks locally!
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          // Simple voice selection fallback
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(v => 
            voice === 'nova' ? v.name.includes('Google US English') || v.name.includes('Female') : v.name.includes('Male')
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          utterance.onstart = () => {
            setIsPlaying(true);
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
          };
          
          utterance.onerror = () => {
            setIsPlaying(false);
          };
          
          window.speechSynthesis.speak(utterance);
          setIsLoading(false);
          return;
        }
      }

      if (audioContentBase64) {
        // Convert base64 to blob and play
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioContentBase64), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        // Handle iOS Safari audio restrictions
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
            setIsPlaying(false);
          }
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
            setIsPlaying(false);
          }
          throw new Error('Audio playback failed - check your device audio settings');
        };
        
        try {
          setIsPlaying(true);
          await audio.play();
        } catch (playError: unknown) {
          const err = playError as Error & { name?: string };
          console.error('Audio play error:', err);
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
            setIsPlaying(false);
          }
          
          if (isIOS && err.name === 'NotAllowedError') {
            throw new Error('Audio blocked - tap to enable speech in browser settings');
          } else {
            throw new Error(`Audio playback failed: ${err.message}`);
          }
        }
      } else {
        throw new Error('No audio content received from TTS service');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('TTS Error:', err);
      const errorMessage = err.message || 'Failed to generate speech';
      toast({
        title: 'Speech Error',
        description: errorMessage,
        variant: 'destructive'
      });
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { speak, stop, isLoading, isPlaying };
};