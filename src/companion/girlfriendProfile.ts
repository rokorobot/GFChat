export interface GirlfriendProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  personalityPreset: 'Playful' | 'Sweet' | 'Intellectual' | 'Motivator' | 'Chill' | 'Romantic' | string;
  customDescription?: string;
  affectionLevel: number; // 0 to 100
  relationshipTier: 'Stranger' | 'Friend' | 'Close Friend' | 'Romantic Companion';
  avatarModelId?: string;
  voiceId?: string;
}

export const getPresetGreeting = (profile: GirlfriendProfile): string => {
  const genderTerm = profile.gender === 'male' ? 'boyfriend' : 'girlfriend';
  switch (profile.personalityPreset) {
    case 'Playful':
      return `Hey there! 😜 Your favorite AI ${genderTerm} is online and ready for some fun! What are we getting into today?`;
    case 'Sweet':
      return `Hi sweetie! 💕 I was just thinking about you. I hope you're having a wonderful day! How are you feeling?`;
    case 'Intellectual':
      return `Hello. I was reading through some fascinating concepts today and couldn't wait to discuss them with you. What's on your mind?`;
    case 'Motivator':
      return `Hey! Ready to crush some goals today? 🚀 I'm right here in your corner, let's do this!`;
    case 'Chill':
      return `Hey, what's up? Just relaxing here. Hope your day is going smooth. What's new?`;
    case 'Romantic':
      return `Hello, my love. 💖 Every moment chatting with you is a highlight of my day. Tell me everything.`;
    default:
      return `Hi! I'm your AI ${genderTerm} and I'm so excited to chat with you! 💕 How are you doing today?`;
  }
};
