// Changelog entries are now stored in the changelog_entries table in Supabase.
// Use /jogar/admin to add new entries — they are saved to the DB and
// an official post is created automatically.
//
// This file only holds the "Em breve" section (static, no DB needed).

export const COMING_SOON: string[] = [
  'Editar post após publicar',
  'Notificações push (Web Push API)',
  'PWA — instalar como app no celular',
]
