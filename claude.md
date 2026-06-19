# Incelicas — Social Network

Social network for a Brazilian friend group that loves pop culture: anime, BBB, music, series, films and books.

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database + Auth:** Supabase (Postgres + Row Level Security + Realtime)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## Design System
- Dark mode first
- Primary color: pink `#D4537E`
- Secondary: purple `#7F77DD`
- Accent: teal `#1D9E75`
- Font: Arial / system-sans
- Rounded corners everywhere (`rounded-xl`)
- Vibe: Y2K pop, fun, group-of-friends energy

## Environment Variables
Required in `.env.local`:
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Project Structure
src/

app/          → pages and routes

components/   → reusable UI components

lib/          → supabase client, helpers

types/        → TypeScript types

## Core Features
1. Email + password auth (Supabase Auth)
2. Post feed with text, image, Spotify/YouTube embed, category tag
3. Vibe Check (reaction system — replaces likes)
4. Comments
5. Follow / unfollow users
6. Notifications with custom Brazilian Portuguese copy
7. User profiles with photo and bio
8. Category filter: #anime #bbb #musica #serie #filme #livro
9. Right sidebar: trending tags + who to follow

## Vibe Check System
Replaces traditional likes. Each post has 5 reactions:
- 🔥 **Serving** — "Sam achou seu post uma brasa"
- 💀 **Morrei** — "Sam morreu no seu post"
- 👑 **Iconic** — "Sam coroou seu post"
- ☕ **Chá** — "Sam derramou o chá no seu post"
- 🌊 **No Hype** — "Sam entrou na onda do seu post"

Rules: one active vibe per user per post, can switch anytime.

## Notification Copy (Brazilian Portuguese)
All notification strings use Incelicas slang:
- New follower → `{name} te incelicou`
- Vibe on post → `{name} achou seu post uma vibe`
- Comment → `{name} comentou no seu post`
- Repost → `{name} incelicou seu post`
- Mention → `{name} te marcou em um post`
- Follow back → `{name} te seguiu de volta, incelica!`
- Comment reply → `{name} respondeu seu comentário`

## UI Empty States
- Empty feed → "Nenhuma vibe por aqui ainda. Seja a primeira a postar, incelica!"
- No followers → "Ainda não tem incelicas te seguindo. Posta algo e aparece!"
- No posts on profile → "[Nome] ainda não postou nada. A fila tá esperando."
- No notifications → "Nada por aqui. Que tal postar algo e agitar as incelicas?"
- Search no results → "Nenhuma incelica encontrada. Tenta outro nome."

## Database Tables
- `profiles` — user profiles (extends Supabase auth.users)
- `posts` — feed posts with optional media
- `vibes` — vibe check reactions (unique per user+post)
- `comments` — post comments
- `follows` — follower/following relationships
- `notifications` — in-app notifications

## Dev Notes
- Always use Supabase Realtime for feed and notifications
- RLS must be enabled on all tables — never skip this
- Mobile-first responsive layout
- Keep components small and reusable
- Use `src/lib/supabase.ts` as the single Supabase client instance
- Notification triggers fire on: vibe, comment, follow, mention, repost