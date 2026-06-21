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

SUPABASE_SERVICE_ROLE_KEY=

INTERNAL_API_SECRET=

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

## Changelog and Status Pages
Changelog and status data live in data files — edit THESE, not the page files directly:
- Changelog entries → `src/lib/changelog.ts` (CHANGELOG_ENTRIES array, newest version first)
- Known bugs → `src/lib/knownBugs.ts` (KNOWN_BUGS array + CURRENT_STATUS)

The pages (`src/app/changelog/page.tsx` and `src/app/status/page.tsx`) import and render from these files automatically.

Rules:
- Every new feature or bug fix → add/update the current version entry in `changelog.ts`
- Bug fixed → "🐛 Corrigido:" prefix in changelog.ts; remove from knownBugs.ts if listed
- New known bug → add to knownBugs.ts; add a "🐛 Bug identificado" entry to changelog.ts
- This must happen automatically after every feature/fix — do not wait to be asked

## Official Post System
After updating `changelog.ts` or `knownBugs.ts`, ALWAYS create an official post announcing the change. Two ways:

### Option A — Admin UI (manual, always works)
Go to `/jogar/admin` → "📣 Criar Post Oficial" section → write message → Publicar.

### Option B — API call (programmatic, requires dev server + env vars)
```bash
curl -X POST http://localhost:3000/api/internal/post \
  -H "Authorization: Bearer $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"content": "YOUR MESSAGE HERE"}'
```

### Post format templates

**New feature / changelog update:**
```
🆕 Nova atualização!

• [feature 1]
• [feature 2]

#incelicas #update
```

**Bug fixed:**
```
🐛 Bug corrigido!

[description of what was fixed]

#incelicas #bugfix
```

**New known bug identified:**
```
⚠️ Bug identificado e sendo investigado:

[bug description]

Já estamos trabalhando na correção! #incelicas
```

The `createOfficialPost(content)` utility is at `src/lib/officialPost.ts`. It uses the Supabase service role key to post as @incelicasappoficial without requiring that account's session. Requires SUPABASE_SERVICE_ROLE_KEY in `.env.local`.