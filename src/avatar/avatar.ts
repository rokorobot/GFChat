export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

export type AvatarEmotion = 'neutral' | 'happy' | 'playful' | 'sweet' | 'romantic' | 'sad' | 'surprised';

export interface AvatarConfig {
  gender: 'male' | 'female';
  style: string; // 'realistic' | 'anime' | 'default'
  customImage?: string;
}

export interface AvatarProvider {
  id: string;
  name: string;
  description: string;
  render: (config: AvatarConfig, state: AvatarState, emotion: AvatarEmotion) => React.ReactNode;
}
