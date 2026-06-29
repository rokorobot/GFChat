export interface AudioSynthesisOptions {
  voice?: string;
  speed?: number;
  volume?: number;
}

export interface TTSProvider {
  id: string;
  name: string;
  speak: (text: string, options?: AudioSynthesisOptions) => Promise<void>;
  stop: () => void;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface STTProvider {
  id: string;
  name: string;
  startListening: (options: SpeechRecognitionOptions) => Promise<void>;
  stopListening: () => void;
}
