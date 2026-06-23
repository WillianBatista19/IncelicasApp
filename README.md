# incelicas

> Rede social completa desenvolvida do zero como projeto de estudo em desenvolvimento web fullstack.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square)

## Sobre o projeto

Incelicas é uma rede social temática desenvolvida para um grupo de amigos apaixonados por cultura pop — anime, BBB, música, séries, filmes e livros. O projeto nasceu como um desafio pessoal de aprender desenvolvimento web fullstack construindo algo real e funcional do zero.

A proposta foi criar uma plataforma com identidade própria: em vez de curtidas genéricas, o sistema de **Vibe Check** permite reagir com emojis temáticos. Em vez de "republicar", os usuários **incelicam** os posts. Cada detalhe da linguagem e das notificações foi pensado para refletir a personalidade do grupo.

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
| NLP local | @xenova/transformers |

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
- Lazy loading de imagens e vídeos para performance
- Atualização em tempo real via Supabase Realtime
- Salvar/favoritar posts com seção dedicada no perfil
- Busca de posts por palavra-chave ou hashtag na página Explorar

### Vibe Check (sistema de reações)
- Substitui o botão de curtida por 5 reações temáticas: 🔥 Serving, 💀 Morri, 👑 Iconic, ☕ Chá, 🌊 No Hype
- Apenas uma vibe ativa por post — pode trocar a qualquer momento
- Contagem individual por tipo de reação
- Modal "ver quem reagiu" com abas por tipo de vibe
- Atualização otimista da interface sem esperar resposta do servidor

### Comentários
- Comentários e respostas em threads
- Curtir comentários com contador
- Menções com @ e autocomplete de usuários
- Editar e excluir comentários próprios
- Contagem total incluindo respostas aninhadas
- Preview do comentário mais curtido sem abrir a seção

### Incelicar (repost)
- Repostar post de outra pessoa com um clique
- Repostar com comentário próprio (quote post)
- Contagem de incelicadas no post original
- Notificação para o autor do post original

### Perfil de usuário
- Foto de perfil, nome de exibição e bio
- Perfil privado com solicitações de seguir (aceitar/recusar)
- Contagem de posts, seguidores e seguindo
- Lista de seguidores e seguindo com botão de seguir inline
- Remover seguidores silenciosamente
- Editar perfil com upload de foto
- Excluir conta com confirmação
- Menu de três pontinhos no mobile para ações do perfil

### Perfil expandido (accordion)
Seções colapsáveis que organizam as integrações externas:
- **🎵 Música** — Last.fm: ouvindo agora, top artistas e músicas da semana
- **🎬 Mídia** — Assistindo agora e Filme favorito via TMDB
- **📚 Leituras** — Lendo agora e Livro favorito via Google Books
- **🎮 Gaming** — Steam: jogando agora e jogos recentes
- **📺 Anime** — Anime favorito via AniList
- **📖 Goodreads** — Livro atual via widget do Goodreads

### Stories
- Stories de 24 horas com imagem
- Visualizador fullscreen com barra de progresso de 5 segundos
- Avançar e voltar entre stories e entre usuários
- Stories filtrados: só aparecem de quem você segue
- Anel colorido para stories não visualizados, desbotado para visualizados
- Curtidas em stories com contador e notificação
- Lista de quem visualizou (para o dono do story)
- Câmera ou galeria para postar story

### Sistema de seguir
- Seguir e deixar de seguir usuários
- Botão "Seguir de volta" quando o usuário já te segue
- Perfis privados com solicitação de seguir
- Contagem de seguidores e seguindo em tempo real

### Notificações
- Notificações em tempo real com badge de não lidas
- Linguagem personalizada com trocadilhos das Incelicas
- Clicar na notificação navega para o post ou perfil relacionado e marca como lida
- Marcar todas como lidas com um clique
- Tipos: vibe, seguidor, seguiu de volta, comentário, resposta, curtida em comentário, incelicada, menção, curtida em story, solicitação de seguir, aceite de solicitação, mensagem direta, mensagem em grupo, post em comunidade

### Mensagens diretas e grupos
- Chat 1 a 1 em tempo real via Supabase Realtime
- Grupos de mensagem com nome, foto e descrição
- Criar grupos selecionando múltiplos usuários
- Gerenciar membros: adicionar, remover, promover a moderador
- Editar nome e foto do grupo (criador)
- Badge de mensagens não lidas na navbar
- Marcar como lido ao abrir a conversa

### Comunidades
Espaços temáticos isolados estilo Orkut — posts ficam dentro da comunidade:
- Criar comunidade com nome, descrição, avatar e banner
- Feed exclusivo por comunidade
- Compositor de posts com foto, vídeo, Spotify/YouTube e Last.fm
- Permissões de postagem: todos, somente criador ou membros autorizados
- Sistema de papéis: Criador, Moderador e Membro
- Moderadores podem excluir posts e comentários
- Vibe Check nos posts de comunidade
- Silenciar notificações por comunidade
- Comunidades padrão: Música, Reality Shows, Fofocas, Séries, Filmes, Livros

### Jogos diários
Página `/jogar` com três desafios que renovam à meia-noite (horário de Brasília):

**🎵 Adivinhe a Música**
- Ouça trechos crescentes: 1s → 2s → 4s → 8s → 16s → 30s
- Autocomplete com busca no Deezer ao digitar o palpite
- 6 tentativas com pontuação decrescente (600 a 100 pontos)
- Revela capa, título e artista ao final
- Preview completo de 30s após encerrar

**🟩 Termo das Incelicas**
- Wordle em português com palavras temáticas de cultura pop
- 5 letras, 6 tentativas, algoritmo correto para letras duplicadas
- Teclado virtual responsivo + teclado físico
- Compartilhar resultado com grade de emojis

**🧠 Contexto**
- Encontre a palavra secreta por similaridade semântica
- Sem limite de tentativas
- Similaridade calculada via embeddings com modelo multilingual local (@xenova/transformers)
- Cores indicam proximidade: 🔴 longe → 🟠 → 🟡 → 🟢 → acertou
- Zero custo recorrente — modelo roda no servidor sem API externa

**Ranking**
- Top 10 por pontuação total, música, termo e contexto separados
- Posição do usuário sempre visível mesmo fora do top 10

### Jogos musicais nas comunidades
Dentro da comunidade Música, aba Jogos:

**🎵 Avaliar Álbum**
- Busque qualquer álbum pelo Spotify e avalie faixa por faixa de 0.0 a 10.0
- Marcadores especiais: Favorita, Melhor composição, Mais viciante, Melhor vocal, Melhor instrumental
- Médias da comunidade por álbum e faixa
- Rankings e seção de avaliações no perfil do usuário

**🎤 Survivor Musical**
- Vote para eliminar a pior faixa de cada rodada
- Votação às cegas, preview de 30s via Deezer
- Regras de empate: eliminação em massa nas rodadas normais, mini-votação na semifinal, co-campeãs em empate na final
- Notificações de eliminação com drama

**⚔️ Mata-Mata**
- Torneio eliminatório com confrontos diretos entre faixas
- Bracket visual com todas as rodadas
- Fases: Oitavas, Quartas, Semifinal, Final

**🏆 Batalha de Álbuns**
- Compara múltiplos álbuns de um mesmo artista
- Votação faixa por faixa por posição
- Categorias extras: álbum favorito, melhor capa, melhores composições, melhor produção
- Evento com duração configurável com resultados e estatísticas detalhadas

### Integrações externas

| Serviço | Uso |
|---|---|
| Last.fm API | Música ouvindo agora, top artistas e músicas |
| TMDB API | Busca de filmes e séries com pôster |
| Google Books API | Busca de livros com capa |
| AniList GraphQL | Busca de animes e mangas com capa |
| Steam API | Jogo em andamento e histórico recente |
| Goodreads | Widget de leitura atual via HTML embed |
| Spotify API | Metadados de músicas, álbuns e artistas |
| Deezer API | Preview de 30s gratuito para jogos musicais |
| @xenova/transformers | Embeddings multilingual para o jogo Contexto |

### Explorar
- Busca de usuários por nome ou @
- Busca de posts por palavra-chave ou hashtag
- Trending de hashtags das últimas 24 horas
- Sugestões de quem seguir e comunidades

### Conta oficial e admin
- Perfil `@incelicasappoficial` com badge verificado
- Permissão de moderação: excluir posts, comentários e stories de qualquer usuário
- Página `/jogar/admin` exclusiva para a conta oficial
- Criar posts oficiais sem limite de caracteres
- Adicionar músicas, palavras do Termo e palavras do Contexto
- Adicionar entradas ao changelog (post oficial criado automaticamente)
- Gerenciar jogos musicais das comunidades

### Páginas institucionais
- `/status` — status do sistema e bugs conhecidos
- `/changelog` — histórico de atualizações com versões e datas

### Tema claro e escuro
- Toggle sol/lua na navbar e no nav mobile
- Preferência salva no localStorage

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
      communities/musica/survivor/
      communities/musica/mata-mata/
      communities/musica/batalha/
      jogar/
      jogar/admin/
    (auth)/
    api/
      spotify/
      spotify/albums/
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
| `profiles` | Perfis com integrações e configurações |
| `posts` | Posts do feed com suporte a reposts |
| `vibes` | Reações dos posts |
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
| `daily_songs` | Banco de músicas para Adivinhe a Música |
| `daily_words` | Banco de palavras para o Termo |
| `contexto_words` | Palavras com embeddings para o Contexto |
| `contexto_attempts` | Tentativas do Contexto |
| `game_attempts` | Tentativas dos jogos diários |
| `game_scores` | Pontuação acumulada |
| `album_ratings` | Avaliações de álbuns |
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
| `changelog_entries` | Histórico de atualizações |

Todas as tabelas têm Row Level Security (RLS) configurado.

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
git clone https://github.com/WillianBatista19/IncelicasApp.git
cd IncelicasApp
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

## Licença

Este projeto é de uso pessoal e educacional.