# Quick Task 260402-w5k: Move AI button to navbar

## Changes
- **ai-chat-button.tsx**: Removed `fixed right-6 bottom-6 z-50 size-12 shadow-lg`, changed to `ghost` variant `size-8 rounded-full`. Swapped `MessageCircle` icon for `Sparkles`.
- **workspace-navbar.tsx**: Added `AiChatButton` before `UserProfileDropdown` in navbar right section with `gap-1`.
- **layout.tsx**: Removed `AiChatButton` render and import (no longer needed as standalone floating button).

## Commit
- `4e4d8bc`: feat(260402-w5k): move AI button to navbar with Sparkles icon
