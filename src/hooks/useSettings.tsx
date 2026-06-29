import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface SavedPersonality {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface AppSettings {
  useDefaultAI: boolean;
  currentPersonality: string;
  savedPersonalities: SavedPersonality[];
  voiceInput: boolean;
  voiceOutput: boolean;
  voiceType: string;
  voiceVolume: number;
  avatarStyle: string;
  chatTheme: string;
  age: number;
  gender: 'male' | 'female';
  aiGender: 'male' | 'female';
}

const PERSONALITY_PROMPTS = {
  Playful: "fun-loving, energetic companion who loves jokes, games, and lighthearted conversations",
  Sweet: "gentle, caring companion who is nurturing, kind, and always supportive",
  Intellectual: "thoughtful, curious companion who enjoys deep discussions, learning, and sharing knowledge",
  Motivator: "encouraging, inspiring companion who helps boost confidence and achieve goals",
  Chill: "relaxed, easygoing companion who keeps things casual and stress-free",
  Romantic: "affectionate, passionate companion who expresses love through words and gestures"
};

const defaultSettings: AppSettings = {
  useDefaultAI: true,
  currentPersonality: '',
  savedPersonalities: [],
  voiceInput: false,
  voiceOutput: true,
  voiceType: 'nova',
  voiceVolume: 80,
  avatarStyle: 'realistic',
  chatTheme: 'romantic',
  age: 25,
  gender: 'female',
  aiGender: 'female',
};

const SettingsContext = createContext<{
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  saveSettings: () => Promise<void>;
  addPersonality: (name: string, description: string) => boolean;
  deletePersonality: (id: string) => void;
  getCurrentPersonalityText: () => string;
  getPersonalityPrompts: () => typeof PERSONALITY_PROMPTS;
  selectPresetPersonality: (presetName: keyof typeof PERSONALITY_PROMPTS) => void;
} | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Migration: Convert old voiceMode to separate voiceInput/voiceOutput
        if ('voiceMode' in parsedSettings && !('voiceInput' in parsedSettings || 'voiceOutput' in parsedSettings)) {
          const { voiceMode, ...rest } = parsedSettings;
          parsedSettings.voiceInput = voiceMode;
          parsedSettings.voiceOutput = voiceMode;
          delete parsedSettings.voiceMode;
        }
        
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addPersonality = (name: string, description: string): boolean => {
    if (settings.savedPersonalities.length >= 5) {
      return false; // Max limit reached
    }
    
    const newPersonality: SavedPersonality = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
    };
    
    setSettings(prev => ({
      ...prev,
      savedPersonalities: [...prev.savedPersonalities, newPersonality],
      currentPersonality: newPersonality.id,
      useDefaultAI: false,
    }));
    
    return true;
  };

  const deletePersonality = (id: string) => {
    setSettings(prev => {
      const updatedPersonalities = prev.savedPersonalities.filter(p => p.id !== id);
      const newCurrentPersonality = prev.currentPersonality === id ? '' : prev.currentPersonality;
      
      return {
        ...prev,
        savedPersonalities: updatedPersonalities,
        currentPersonality: newCurrentPersonality,
        useDefaultAI: newCurrentPersonality === '' || prev.useDefaultAI,
      };
    });
  };

  const getCurrentPersonalityText = (): string => {
    if (settings.useDefaultAI) {
      return '';
    }
    
    const currentPersonality = settings.savedPersonalities.find(
      p => p.id === settings.currentPersonality
    );
    
    return currentPersonality?.description || '';
  };

  const getPersonalityPrompts = () => PERSONALITY_PROMPTS;

  const selectPresetPersonality = (presetName: keyof typeof PERSONALITY_PROMPTS) => {
    const description = PERSONALITY_PROMPTS[presetName];
    const success = addPersonality(presetName, description);
    if (!success) {
      // If can't add (limit reached), just update current to use this preset
      setSettings(prev => ({
        ...prev,
        currentPersonality: presetName,
        useDefaultAI: false
      }));
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving settings:', error);
      return Promise.reject(error);
    }
  };

  // Don't render children until settings are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      saveSettings, 
      addPersonality, 
      deletePersonality, 
      getCurrentPersonalityText,
      getPersonalityPrompts,
      selectPresetPersonality
    }}>
      {children}
    </SettingsContext.Provider>
  );
};