# Release Notes

## [v0.1.3] - Voice Input Loop (`feature/voice-input-loop`)
- **Robust Local Speech Recognition**: Revamped the Web Speech API voice capture hook (`useVoiceInput.ts`) with callback ref-locks to prevent event loop disconnects or recreation on typing/keystrokes.
- **Bi-directional Interruption**: Configured voice input to immediately cut off and silence active companion audio output on mic click.
- **Review Before Send**: Populate transcript directly into the chat input bar, enabling users to edit, review, and manually tap Send rather than auto-submitting.
- **Dynamic Indicators**: Connect microphone states to update input field placeholders and trigger avatar `Listening...` indicators.
- **Voice Enabled by Default**: Enabled `voiceInput` in default app settings so the microphone toggle button is visible by default on initial install.

---

## [v0.1.2] - Adaptive Desktop Layout (`feature/adaptive-desktop-layout`)
- **Adaptive Two-Zone Layout**: Added full desktop breakpoint support. On wide viewports (`lg:`), the screen is split: the conversation panel (messages & input bar) occupies the left/center, while a dedicated companion detail panel moves to the right.
- **Improved Space Efficiency**: Pruned excessive vertical whitespace on top of the mobile vertical flow.
- **Friendly State Indicators**: Replaced raw technical avatar action labels with warm, emotionally resonant companion descriptors.
- **Header Navigation Consolidation**: Moved absolute positioned settings and logout buttons directly into the primary header bar of `ChatInterface.tsx` to prevent overlay rendering bugs on varying screen widths.
- **Supabase TTS Edge Fallback**: Configured automatic failover to local browser `SpeechSynthesis` if the remote Edge Function fails or is offline, avoiding noisy toast warning banners.
- **StrictMode Welcome Deduplication**: Fixed double welcome message creation on initial loads by adding lock guards (`isInitializingRef`) to handle React StrictMode double mounts.
- **User Avatar Shrink Protection**: Applied `shrink-0` classes to message avatars to keep bubbles and tags aligned on wide screens.

---

## [v0.1.1] - Realtime Speaking Loop (`feature/realtime-speaking-loop`)
- **Interactive Avatar Stage Reactions**: Mounted the animated `<AvatarStage>` onto the main chat window interface, rendering standard visual states (idle, listening, thinking, speaking) dynamically.
- **Microphone & Keyboard Binding**: Tied avatar states to input triggers. Typing text transitions the avatar to `listening`, sending a message changes it to `thinking`, and microphone input triggers a listening state.
- **Audio Output Synchronization**: Synchronized the avatar's `speaking` state directly with the active playing duration of TTS voice audio. Interrupts like sending a new message or resetting the chat immediately stop any previous audio playback.
- **Local Fallback Speech Synthesis**: Integrated browser-native `speechSynthesis` API fallback. If Supabase config variables are missing, the AI companion actually speaks using native local text-to-speech!
- **Default Companion Profile Details**: Added live companion name badge ("Mia" / "Alex") and active personality preset info indicators directly to the UI.

---

## [v0.1.0] - Speaking Avatar Architecture Baseline (`v0.1.0-clean-baseline`)
This release transitions GF.Chat from a static Lovable prototype into a robust, provider-agnostic Speaking Avatar architecture with built-in graceful local fallback features.

### Key Changes:
- **Client Dynamic Environments**: Patched `src/integrations/supabase/client.ts` to dynamically fetch variables from `import.meta.env`.
- **Graceful Fallback Mode**: If `VITE_SUPABASE_URL` is unconfigured, the application automatically launches in **Local Preview Mode** with `localStorage` message history.
- **Lint Compliance**: Fixed a critical hook ordering bug in `ChatInterface.tsx` and resolved typescript type warnings.
- **Provider-Agnostic Folders**: Introduced `src/companion/`, `src/avatar/`, `src/voice/`, and `src/backend/` folders.
