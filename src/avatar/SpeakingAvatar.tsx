import React from 'react';
import { motion } from 'framer-motion';
import { AvatarState, AvatarEmotion } from './avatar';
import gfAvatar from '@/assets/gf-avatar.png';
import maleAvatar from '@/assets/male-avatar.png';

interface SpeakingAvatarProps {
  gender: 'male' | 'female';
  state: AvatarState;
  emotion: AvatarEmotion;
}

export const SpeakingAvatar: React.FC<SpeakingAvatarProps> = ({ gender, state, emotion }) => {
  const avatarSrc = gender === 'male' ? maleAvatar : gfAvatar;

  // Set up framer-motion animations depending on the state
  const getAnimationProps = () => {
    switch (state) {
      case 'speaking':
        return {
          animate: {
            scale: [1, 1.03, 1],
            y: [0, -4, 0],
          },
          transition: {
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
          }
        };
      case 'thinking':
        return {
          animate: {
            opacity: [0.8, 1, 0.8],
          },
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }
        };
      case 'listening':
        return {
          animate: {
            scale: [1, 1.01, 1],
          },
          transition: {
            repeat: Infinity,
            duration: 2.0,
            ease: "easeInOut",
          }
        };
      case 'idle':
      default:
        return {
          animate: {
            y: [0, -2, 0],
          },
          transition: {
            repeat: Infinity,
            duration: 4.0,
            ease: "easeInOut",
          }
        };
    }
  };

  const getEmotionalRingColor = () => {
    switch (emotion) {
      case 'romantic':
        return 'from-pink-400 to-rose-600 shadow-rose-400/50';
      case 'playful':
        return 'from-amber-400 to-orange-500 shadow-orange-400/50';
      case 'sweet':
        return 'from-pink-300 to-purple-400 shadow-purple-300/50';
      case 'happy':
        return 'from-emerald-400 to-teal-500 shadow-emerald-400/50';
      default:
        return 'from-primary to-accent shadow-primary/50';
    }
  };

  const getFriendlyStateLabel = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking of you...';
      case 'speaking':
        return 'Talking...';
      case 'idle':
      default:
        return 'Here with you';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Glow Ring behind Avatar */}
        <motion.div 
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${getEmotionalRingColor()} opacity-60 blur-md`}
          animate={{
            scale: state === 'speaking' ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'speaking' ? 0.8 : 3.0,
          }}
        />

        {/* Outer Ring Border */}
        <div className={`relative w-48 h-48 rounded-full overflow-hidden p-[3px] bg-gradient-to-br ${getEmotionalRingColor()} shadow-xl`}>
          <motion.div 
            className="w-full h-full rounded-full overflow-hidden bg-background"
            {...getAnimationProps()}
          >
            <img 
              src={avatarSrc} 
              alt="Speaking Avatar Portrait" 
              className="w-full h-full object-cover select-none"
            />
          </motion.div>
        </div>

        {/* State Badge Overlay */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-card border border-border px-3 py-0.5 rounded-full shadow-md text-xs font-semibold whitespace-nowrap">
          <span>{getFriendlyStateLabel()}</span>
        </div>
      </div>
    </div>
  );
};
