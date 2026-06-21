// Changelog entries are now stored in the changelog_entries table in Supabase.
// Use /jogar/admin to add new entries — they are saved to the DB and
// an official post is created automatically.
//
// This file only holds the "Em breve" section (static, no DB needed).

export const COMING_SOON: string[] = [
  'Mensagens diretas entre usuários',
  'Editar post após publicar',
  'Busca de posts e conteúdo',
  'Notificações push (Web Push API)',
  'Salvar posts para ver depois',
  'PWA — instalar como app no celular',
]
