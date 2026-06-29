import React, { useState } from 'react';
import { AvatarProvider, AvatarConfig, AvatarState, AvatarEmotion } from './avatar';
import { SpeakingAvatar } from './SpeakingAvatar';

// 1. Static Speaking Avatar Provider (Default v0.1 implementation)
export const StaticSpeakingAvatarProvider: AvatarProvider = {
  id: 'static-speaking',
  name: 'Speaking Portrait',
  description: 'An animated 2D avatar portrait that changes states based on interaction',
  render: (config: AvatarConfig, state: AvatarState, emotion: AvatarEmotion) => {
    return (
      <SpeakingAvatar 
        gender={config.gender} 
        state={state} 
        emotion={emotion} 
      />
    );
  }
};

// Placeholders for future implementations
export const Live2DAvatarProvider: AvatarProvider = {
  id: 'live2d',
  name: 'Live2D Model (Future)',
  description: 'Interactive Live2D anime character avatar',
  render: (config: AvatarConfig) => (
    <div className="flex flex-col items-center justify-center p-8 bg-card/40 rounded-xl border border-border/60">
      <div className="text-sm font-medium text-muted-foreground mb-2">Live2D Avatar Layer</div>
      <div className="text-xs text-muted-foreground/80">Configure model files in settings to activate.</div>
    </div>
  )
};

export const WanStreamerProvider: AvatarProvider = {
  id: 'wan-streamer',
  name: 'Wan Streamer Realtime (Future)',
  description: 'Realtime interactive stream from Wan video model',
  render: () => (
    <div className="flex flex-col items-center justify-center p-8 bg-card/40 rounded-xl border border-border/60">
      <div className="text-sm font-medium text-muted-foreground mb-2">Wan Streamer Layer</div>
      <div className="text-xs text-muted-foreground/80">Requires WebRTC streaming server credentials.</div>
    </div>
  )
};

interface AvatarStageProps {
  gender: 'male' | 'female';
  state: AvatarState;
  emotion: AvatarEmotion;
  providerId?: string;
  customStyle?: string;
}

export const AvatarStage: React.FC<AvatarStageProps> = ({
  gender,
  state,
  emotion,
  providerId = 'static-speaking',
  customStyle = 'default'
}) => {
  const providers: Record<string, AvatarProvider> = {
    'static-speaking': StaticSpeakingAvatarProvider,
    'live2d': Live2DAvatarProvider,
    'wan-streamer': WanStreamerProvider
  };

  const currentProvider = providers[providerId] || StaticSpeakingAvatarProvider;
  const config: AvatarConfig = {
    gender,
    style: customStyle
  };

  return (
    <div className="w-full flex justify-center py-2 transition-all duration-300">
      {currentProvider.render(config, state, emotion)}
    </div>
  );
};
