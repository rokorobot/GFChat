# Release Notes - feature/avatar-architecture

This release transitions GF.Chat from a static Lovable prototype into a robust, provider-agnostic Speaking Avatar architecture with built-in graceful local fallback features.

## What's Changed

### 1. Robust Configuration & Fallbacks
- **Client Dynamic Environments**: Patched `src/integrations/supabase/client.ts` to dynamically fetch variables from `import.meta.env` rather than hardcoding legacy project credentials.
- **Graceful Fallback Mode**: If `VITE_SUPABASE_URL` is unconfigured, the application automatically launches in **Local Preview Mode**. Message history and custom profile memories are managed locally in `localStorage`.

### 2. Lint Compliance & Code Health
- **React Hooks Order Violation**: Fixed a critical hook ordering bug in `ChatInterface.tsx` where an early return was declared before other `useEffect` declarations.
- **TypeScript Cleanups**: Resolved empty interface and explicit-any warnings on `textarea.tsx`, `command.tsx`, `useVoiceInput.ts`, and `companionClient.ts`.

### 3. Provider-Agnostic Architecture
Introduced the folder skeleton layout with standard TS interfaces for:
- **`src/companion/`**: Personality styles, customized profiles, relationship structures (`girlfriendProfile.ts`, `relationshipMemory.ts`).
- **`src/avatar/`**: Render states (idle, listening, thinking, speaking) and emotional expressions (`avatar.ts`, `SpeakingAvatar.tsx`, `AvatarStage.tsx`).
- **`src/voice/`**: Interface boundaries for TTS and STT sound engines (`voice.ts`).
- **`src/backend/`**: An abstraction layer for companion database communication (`companionClient.ts`).

### 4. Interactive Avatar UI
- Integrated the new `<AvatarStage>` component into `ChatInterface.tsx` which animates the avatar portrait (pulsing glow, size scaling, state transitions) based on voice activity and chat typing actions.
