# zapli

> Rede social completa desenvolvida do zero como projeto de estudo em desenvolvimento web fullstack.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square)

## Sobre o projeto

Zapli é uma rede social temática desenvolvida para um grupo de amigos apaixonados por cultura pop — anime, reality shows, música, séries, filmes e livros. O projeto nasceu como um desafio pessoal de aprender desenvolvimento web fullstack construindo algo real e funcional do zero.

A proposta foi criar uma plataforma com identidade própria: em vez de curtidas genéricas, o sistema de **Vibe Check** permite reagir com emojis temáticos. Em vez de "republicar", os usuários **zapliam** os posts. Cada detalhe da linguagem e das notificações foi pensado para refletir a personalidade do grupo.

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Banco de dados | Supabase (PostgreSQL + pgvector) |
| Autenticação | Supabase Auth |
| Estilização | Tailwind CSS |
| Deploy | Vercel |
| Armazenamento | Supabase Storage |
| Tempo real | Supabase Realtime |
| Similaridade semântica | Google Gemini Embeddings API |

## Funcionalidades

### Feed e posts
- Criação de posts com texto, imagem, GIF e vídeo
- Embed automático de músicas do Spotify e vídeos do YouTube
- Busca e inserção de filmes via TMDB com pôster automático
- Busca e inserção de livros via Google Books com capa automática
- Busca e inserção de animes via AniList com capa automática
- Hashtags livres com trending dinâmico das últimas 24 horas
- Feed filtrado por hashtag
- Feed personalizado: só aparecem posts de quem você segue + conta oficial
- Scroll infinito com carregamento de 20 posts por vez
- Atualização em tempo real via Supabase Realtime
- Salvar/favoritar posts com seção dedicada no perfil
- Busca de posts por palavra-chave ou hashtag na página Explorar

### Vibe Check (sistema de reações)
8 reações temáticas únicas:
- 🔥 Serving, 💀 Morri, 👑 Iconic, 🍅 Tomate, 💩 Cocô, 🤯 Gag, 🦕 Old, 6️⃣7️⃣ Six Seven
- Apenas uma vibe ativa por post — pode trocar a qualquer momento
- Modal "ver quem reagiu" com abas por tipo de vibe
- Atualização otimista sem esperar resposta do servidor

### Comentários
- Comentários e respostas em threads
- Curtir comentários com contador
- Menções com @ e autocomplete de usuários
- Editar e excluir comentários próprios
- Contagem total incluindo respostas aninhadas

### Zapliar (repost)
- Zapliar post de outra pessoa com um clique
- Zapliar com comentário próprio (quote post)
- Contagem de zapliadas no post original
- Notificação para o autor do post original

### Perfil de usuário
- Foto de perfil, nome de exibição e bio
- Perfil privado com solicitações de seguir (aceitar/recusar)
- Remover seguidores silenciosamente
- Contagem de posts, seguidores e seguindo
- Editar perfil com upload de foto
- Menu de três pontinhos no mobile para ações do perfil

### Perfil expandido (accordion)
Seções colapsáveis com integrações externas:
- **🎵 Música** — Last.fm: ouvindo agora, top artistas e músicas
- **🎬 Mídia** — Assistindo agora e Filme favorito via TMDB
- **📚 Leituras** — Lendo agora e Livro favorito via Google Books
- **🎮 Gaming** — Steam: jogando agora e jogos recentes
- **📺 Anime** — Anime favorito via AniList
- **📖 Goodreads** — Livro atual via widget do Goodreads
- **⏳ Aguardando** — Contagem regressiva para álbum aguardado

### Stories
- Stories de 24 horas com imagem
- Visualizador fullscreen com barra de progresso
- Filtrados: só aparecem de quem você segue
- Curtidas com contador e notificação
- Lista de quem visualizou (para o dono)

### Sistema de seguir
- Seguir e deixar de seguir usuários
- Perfis privados com solicitação de seguir
- Botão "Seguir de volta" automático

### Notificações
- Tempo real com badge de não lidas
- Linguagem personalizada com gírias do Zapli
- Clicar marca como lida e navega para o conteúdo
- Tipos: vibe, seguidor, comentário, zapliada, menção, curtida em story, solicitação de seguir, mensagem, post em comunidade

### Mensagens diretas e grupos
- Chat 1 a 1 em tempo real
- Grupos com nome, foto e descrição
- Gerenciar membros: adicionar, remover, promover a moderador
- Badge de mensagens não lidas na navbar

### Comunidades
Espaços temáticos isolados estilo Orkut:
- Criar comunidade com nome, descrição, avatar e banner
- Feed exclusivo por comunidade
- Compositor de posts com foto, vídeo, Spotify/YouTube e Last.fm
- Permissões de postagem: todos, somente criador ou membros autorizados
- Sistema de papéis: Criador, Moderador e Membro
- Vibe Check nos posts de comunidade
- Silenciar notificações por comunidade
- Álbuns mais aguardados pelos membros com contagem regressiva
- Comunidades padrão: Música, Reality Shows, Fofocas, Séries, Filmes, Livros

### Jogos diários
Página `/jogar` com três desafios que renovam à meia-noite (horário de Brasília):

**🎵 Adivinhe a Música**
- Ouça trechos crescentes: 1s → 2s → 4s → 8s → 16s → 30s
- Autocomplete com busca no Deezer
- 6 tentativas com pontuação decrescente (600 a 100 pontos)
- Upload manual de áudio pelo admin para músicas sem preview

**🟩 Termo do Zapli**
- Wordle em português com palavras temáticas de cultura pop
- 5 letras, 6 tentativas
- Células clicáveis — edite qualquer posição na palavra
- Teclado virtual + teclado físico

**🧠 Contexto**
- Encontre a palavra secreta por similaridade semântica
- Sem limite de tentativas
- Ranking por proximidade: quanto menor o número, mais perto
- Similaridade via Google Gemini Embeddings API

**Ranking**
- Top 10 por pontuação total, música, termo e contexto

### Jogos musicais (Comunidade Música)

**🎵 Avaliar Álbum**
- Avalie faixa por faixa de 0.0 a 10.0
- Marcadores especiais: Favorita, Melhor composição, Mais viciante, Melhor vocal, Melhor instrumental
- Review em texto por álbum
- Rankings: Top, Mais avaliados, Recentes, 2026, Todos

**🎤 Survivor Musical**
- Vote para eliminar a pior faixa de cada rodada
- Votação às cegas
- Regras de empate inteligentes por fase (normal/semifinal/final)
- Co-campeãs em empate na final

**⚔️ Mata-Mata**
- Torneio eliminatório com confrontos diretos
- Bracket visual com todas as rodadas
- Fases: Oitavas, Quartas, Semifinal, Final

**🏆 Batalha de Álbuns**
- Compara múltiplos álbuns de um mesmo artista
- Votação faixa por faixa por posição
- Categorias extras: álbum favorito, melhor capa, composições, produção
- Resultado em tempo real durante votação

**🏆 Grammy Predictions**
- Vote em quem vai ganhar e quem deveria ganhar por categoria
- Todas as 50 categorias do Grammy 2027 pré-cadastradas incluindo as 5 novas
- Pontuação por acerto nas previsões
- Ranking de melhores previsores

### Integrações externas

| Serviço | Uso |
|---|---|
| Last.fm API | Música ouvindo agora, top artistas e músicas |
| TMDB API | Busca de filmes e séries |
| Google Books API | Busca de livros |
| AniList GraphQL | Busca de animes |
| Steam API | Jogos em andamento e histórico |
| Goodreads | Widget de leitura via HTML embed |
| Spotify API | Músicas, álbuns e artistas |
| Deezer API | Preview de 30s para jogos musicais |
| Google Gemini API | Similaridade semântica para o Contexto |

### Atalhos e navegação
- Fixar comunidades e jogos favoritos na sidebar (desktop)
- Bottom sheet "···" no mobile com acesso rápido a todas as seções
- Toggle de tema claro/escuro no bottom sheet mobile

### Conta oficial e admin
- Perfil `@zaplioficial` com badge verificado
- Moderação: excluir posts, comentários e stories de qualquer usuário
- `/jogar/admin`: adicionar músicas (Spotify ou upload manual), palavras do Termo e Contexto
- Criar posts oficiais sem limite de caracteres
- Gerenciar changelog (post oficial criado automaticamente)
- Gerenciar jogos musicais das comunidades
- Gerenciar Grammy: criar edições, categorias, indicados e revelar vencedores

## Arquitetura

```
src/
  app/
    (app)/
      feed/
      profile/[username]/
      profile/edit/
      explore/
      notifications/
      messages/
      messages/[conversationId]/
      communities/
      communities/[slug]/
      communities/musica/avaliar/
      communities/musica/avaliar/todos/
      communities/musica/survivor/
      communities/musica/mata-mata/
      communities/musica/batalha/
      communities/musica/grammy/
      jogar/
      jogar/admin/
    (auth)/
    api/
      spotify/
      spotify/albums/
      spotify/artist/
      steam/
      contexto/similarity/
      contexto/generate-embedding/
    changelog/
    status/
  components/
  hooks/
  lib/
  types/
  context/
```

## Banco de dados

Principais tabelas no PostgreSQL via Supabase:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis com integrações e álbum aguardado |
| `posts` | Posts do feed com suporte a reposts |
| `vibes` | Reações dos posts (8 tipos) |
| `comments` | Comentários e respostas |
| `comment_likes` | Curtidas em comentários |
| `follows` | Relações de seguir |
| `follow_requests` | Solicitações para perfis privados |
| `saved_posts` | Posts salvos |
| `notifications` | Notificações de todas as ações |
| `stories` | Stories de 24 horas |
| `story_views` | Visualizações de stories |
| `story_likes` | Curtidas em stories |
| `hashtags` | Extraídas automaticamente via trigger |
| `conversations` | Conversas diretas e grupos |
| `conversation_participants` | Participantes das conversas |
| `messages` | Mensagens das conversas |
| `communities` | Comunidades temáticas |
| `community_members` | Membros e papéis |
| `community_posts` | Posts das comunidades |
| `community_comments` | Comentários nos posts de comunidade |
| `community_post_vibes` | Reações nos posts de comunidade |
| `community_awaited_albums` | Álbuns aguardados votados na comunidade |
| `community_album_votes` | Votos nos álbuns aguardados |
| `daily_songs` | Banco de músicas para Adivinhe a Música |
| `daily_words` | Banco de palavras para o Termo |
| `contexto_words` | Palavras do Contexto |
| `contexto_attempts` | Tentativas do Contexto |
| `game_attempts` | Tentativas dos jogos diários |
| `game_scores` | Pontuação acumulada |
| `album_ratings` | Avaliações de álbuns com review |
| `track_ratings` | Notas por faixa |
| `survivor_events` | Eventos do Survivor |
| `survivor_tracks` | Faixas do Survivor |
| `survivor_votes` | Votos do Survivor |
| `matamata_events` | Eventos do Mata-Mata |
| `matamata_tracks` | Faixas do Mata-Mata |
| `matamata_matchups` | Confrontos por rodada |
| `matamata_votes` | Votos nos confrontos |
| `batalha_events` | Eventos da Batalha de Álbuns |
| `batalha_albums` | Álbuns participantes |
| `batalha_track_votes` | Votos por posição de faixa |
| `batalha_category_votes` | Votos nas categorias |
| `grammy_editions` | Edições do Grammy |
| `grammy_categories` | Categorias por edição |
| `grammy_nominees` | Indicados por categoria |
| `grammy_votes` | Previsões e desejos dos usuários |
| `user_shortcuts` | Atalhos fixados na sidebar |
| `changelog_entries` | Histórico de atualizações |

Todas as tabelas têm Row Level Security (RLS) configurado.

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
git clone https://github.com/WillianBatista19/ZapliApp.git
cd ZapliApp
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_LASTFM_API_KEY=
NEXT_PUBLIC_TMDB_API_KEY=
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
STEAM_API_KEY=
GOOGLE_GEMINI_API_KEY=
HUGGING_FACE_API_KEY=
```

### Banco de dados

Execute o arquivo `supabase/schema.sql` no SQL Editor do Supabase.

### Executar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy

Deploy automático no Vercel a cada push para `master`. Configure as variáveis de ambiente em **Settings → Environment Variables**.

## Funcionalidades planejadas

- [ ] Notificações push no celular (Web Push API)
- [ ] PWA — instalar como app no celular
- [ ] Ranking semântico real do Contexto via FastText

## Licença

Este projeto é de uso pessoal e educacional.