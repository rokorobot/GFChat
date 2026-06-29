import { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { runtimeMode } from '@/lib/runtimeConfig';

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
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWithBrowserSynthesis = (text: string, voiceName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('SpeechSynthesis is not supported in this browser.'));
        return;
      }

      // Cancel any current speaking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Select voice based on settings selection
      const selectedVoice = voices.find(v => 
        voiceName === 'nova' ? v.name.includes('Google US English') || v.name.includes('Female') : v.name.includes('Male')
      );
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        resolve();
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (e) => {
        setIsPlaying(false);
        reject(new Error(`Browser SpeechSynthesis error: ${e.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const speak = async (text: string, voice: string = 'alloy') => {
    if (!text.trim()) return;

    stop();
    setIsLoading(true);

    try {
      let playedAudio = false;

      // 1. Try Supabase TTS Edge Function first if configured
      if (isSupabaseConfigured) {
        console.log("[GF.Chat] calling remote TTS Edge Function");
        try {
          const { data, error } = await supabase.functions.invoke('text-to-speech', {
            body: { text, voice }
          });

          if (error) {
            throw error;
          }

          const audioContentBase64 = data?.audioContent || '';
          if (audioContentBase64) {
            const audioBlob = new Blob([
              Uint8Array.from(atob(audioContentBase64), c => c.charCodeAt(0))
            ], { type: 'audio/mpeg' });
            
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;
            
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
            };
            
            setIsPlaying(true);
            await audio.play();
            playedAudio = true;
          }
        } catch (supabaseError) {
          console.warn('Supabase TTS failed, trying browser SpeechSynthesis fallback:', supabaseError);
        }
      } else {
        console.log("[GF.Chat] skipping remote TTS in local mode");
      }

      // 2. Fall back to browser SpeechSynthesis if Supabase is unconfigured or failed
      if (!playedAudio) {
        try {
          await speakWithBrowserSynthesis(text, voice);
        } catch (fallbackError) {
          console.error('Both Supabase TTS and browser fallback failed:', fallbackError);
          throw new Error('Audio playback failed - check your device audio settings.');
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: 'Speech Error',
        description: err.message || 'Failed to generate speech',
        variant: 'destructive'
      });
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { speak, stop, isLoading, isPlaying };
};