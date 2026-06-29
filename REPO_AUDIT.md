# GF.Chat Repository Audit (gfchat-pwa)

This audit summarizes the frontend codebase structure, technology stack, features, lint status, and recommended architectural enhancements for GF.Chat.

## 1. Current Technology Stack
- **Frontend Framework**: React 18.3.1 (with TypeScript)
- **Build Tool**: Vite 5.4.19 with SWC compiler
- **Styling**: TailwindCSS 3.4.17 + PostCSS + Tailwind Animate + Radix UI primitives for styling and design system.
- **State Management & Querying**: `@tanstack/react-query` for server-state caching.
- **Routing**: `react-router-dom` v6
- **Database & Services**: `@supabase/supabase-js` v2.57.4
- **Animation**: `framer-motion` v12

## 2. Main Features Status

### Working Features
- **PWA Configuration**: Has a registered service worker (`sw.js`) and standard web manifest configurations for standalone homescreen installation.
- **Local Settings / Preferences**: LocalStorage-backed settings manager (`src/hooks/useSettings.tsx`) allowing customized personalities, preset genders (male/female companion, male/female user), and toggle settings for voice/visual choices.
- **Vite Build**: Compiles successfully with zero production build errors.
- **Voice Integrations**: 
  - Text-to-Speech (TTS) using Supabase Edge Functions with OpenAI `alloy`/`nova` voices (`src/hooks/useTextToSpeech.ts`).
  - Web Speech API Speech Recognition wrapper for voice input (`src/hooks/useVoiceInput.ts`).

### Broken / Blocked Features
- **ESLint/Lint Status**: The codebase fails lint checks with 13 errors, including a critical React Hook violation (conditional `useEffect` calls in `src/components/chat/ChatInterface.tsx` after an early return) and some TypeScript interface/any issues.
- **Supabase Integration**: Currently depends on a hardcoded legacy Supabase URL and publishing key inside `client.ts` which may be inactive or lack appropriate tables/functions.

## 3. PWA Status
- `sw.js` in root directory handles basic caching.
- Manifest setup is present in `index.html` referencing PWA icons.
- Workbox/Vite-PWA plugin is not explicitly installed; instead, it uses a custom service worker (`sw.js`).

## 4. Recommended Next Steps
1. **Fix Critical React Hook Lint Error**: Move settings checks below or merge hook conditions in `ChatInterface.tsx` to restore full hook order guarantees.
2. **Setup Graceful Fallback / Mock Mode**: Modify `AuthProvider` and API clients to fall back dynamically to local/mock/preview modes if Supabase connection fails or is unconfigured.
3. **Establish clean speaking-avatar structure**: Initialize `src/avatar/`, `src/voice/`, and `src/companion/` folder skeletons.
