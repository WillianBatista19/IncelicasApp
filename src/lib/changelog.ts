export interface ChangelogEntry {
  version: string
  date:    string
  title:   string
  items:   string[]
}

// ─── Add new entries at the TOP of this array ────────────────────────────────
// After adding/editing an entry, call createOfficialPost() via the internal API.
// See CLAUDE.md for the exact format and curl command.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: 'v0.13',
    date:    'Jun 2026',
    title:   'Goodreads — lendo no perfil',
    items: [
      'Integração com Goodreads via widget HTML: cole o código do widget no perfil e o livro aparece automaticamente',
      'Card "Lendo no Goodreads 📚" no perfil com capa do livro, título, autor e avaliação em estrelas',
      'Avaliação em estrelas ★★★☆☆ exibida em rosa com link "ver no Goodreads"',
      'Parser client-side extrai capa, título, autor e nota direto do HTML do widget sem precisar de API key',
    ],
  },
  {
    version: 'v0.12',
    date:    'Jun 2026',
    title:   'Jogar — Termo das Incelicas e Adivinhe a Música',
    items: [
      'Página /jogar com dois desafios diários: Termo das Incelicas (Wordle) e Adivinhe a Música',
      'Termo das Incelicas: adivinhe a palavra de 5 letras em até 6 tentativas com feedback de letras corretas, presentes e ausentes',
      'Adivinhe a Música: ouça trechos crescentes (1s → 2s → 4s → 8s → 16s → 30s) e tente acertar o nome da música',
      'Sistema de pontuação: 600 pts na 1ª tentativa, decrescendo até 100 na 6ª',
      'Ranking geral com abas Geral, Música e Termo — top 10 + posição do usuário',
      'Card de desafios diários no feed com link para /jogar',
      'Ícone 🎮 Jogar adicionado na sidebar e no nav mobile',
      'Página /jogar/admin para a conta oficial adicionar músicas via URL do Spotify e palavras avulsas',
      'API proxy server-side /api/spotify para buscar detalhes da faixa sem expor credenciais',
      'Preview de áudio via Deezer (30s MP3 gratuito) — Spotify não fornece mais preview_url',
      'Busca com autocomplete ao adivinhar música: dropdown com sugestões do Deezer ao digitar',
      '🐛 Corrigido: algoritmo de cores do Termo reescrito com dois passos explícitos e array remaining[] para garantir que letras duplicadas sejam coloridas corretamente (ex: "CARRO" — Rs extras viram cinza, não amarelo)',
      '🐛 Corrigido: estado vazio do Adivinhe a Música agora exibe mensagem orientando o admin a adicionar músicas em /jogar/admin',
      '🐛 Corrigido: erros de RPC (get_daily_word, get_daily_song) agora são logados no console com código e mensagem para facilitar diagnóstico de permissões',
      '🐛 Corrigido: capas de "Assistindo agora" e "Lendo agora" não apareciam porque a coluna watching_now é armazenada como texto JSON no banco — o Supabase retornava string ao invés de objeto, causando poster_url undefined. Agora o perfil e o formulário de edição fazem JSON.parse quando o valor é uma string.',
    ],
  },
  {
    version: 'v0.11',
    date:    'Jun 2026',
    title:   'Navegação de notificações e página de post',
    items: [
      '🐛 Corrigido: Clicar em notificações de vibe, comentário, resposta e curtida de comentário redirecionava para o perfil do usuário em vez do post relacionado. Agora navega corretamente para o post.',
      'Página dedicada /post/[id] para visualizar um post com comentários abertos',
      'Notificações de vibe, repost e menção agora abrem o post diretamente',
      'Notificações de comentário e resposta abrem o post e rolam até o comentário específico',
      'Notificações de follow e follow_back continuam indo para o perfil do usuário',
      'Botão "Voltar ao feed" na página de post',
      'Comentário referenciado fica brevemente destacado em rosa ao ser acessado via notificação',
    ],
  },
  {
    version: 'v0.10',
    date:    'Jun 2026',
    title:   'Correção de visualização de stories',
    items: [
      'Views de stories agora persistem corretamente no banco de dados',
      'Corrigido: upsert sem permissão de UPDATE bloqueava o salvamento silenciosamente — substituído por INSERT com tratamento de duplicata (código 23505)',
      'Ao abrir stories de um usuário, o viewer abre diretamente no primeiro story não visto',
      'Erros ao salvar view agora são logados no console para facilitar diagnóstico',
    ],
  },
  {
    version: 'v0.9',
    date:    'Jun 2026',
    title:   'Integração com Steam e correções de layout',
    items: [
      'Campo Steam ID no perfil para conectar sua conta Steam',
      'Banner "Jogando agora 🎮" exibido no perfil quando o usuário está em uma partida',
      'Seção "Jogos recentes" com os últimos 3 jogos e tempo de jogo total',
      'Status atualizado automaticamente a cada 60 segundos no perfil',
      'API route server-side para proteger a chave Steam (sem expor no cliente)',
      'Capas de "Assistindo agora" e "Lendo agora" com fallback quando não há imagem disponível',
      'Layout do perfil corrigido no mobile: conteúdo ocupa a largura total da tela',
    ],
  },
  {
    version: 'v0.8',
    date:    'Jun 2026',
    title:   'AniList e favoritos no perfil',
    items: [
      'Busca de anime e manga via AniList com toggle Anime/Manga no compositor de posts',
      'Cover art do anime/manga preenchida automaticamente como imagem do post',
      'Campo "Anime favorito" no perfil com capa exibida na página de perfil',
      'Modal de busca com debounce de 500ms, cache de 10 entradas e mensagem amigável para rate limit',
    ],
  },
  {
    version: 'v0.7',
    date:    'Jun 2026',
    title:   'Busca de filmes, séries e livros',
    items: [
      'Integração com TMDB: busca de filmes e séries direto no compositor de posts',
      'Integração com Google Books: busca de livros no compositor com chave de API',
      'Pôster ou capa preenchidos automaticamente como imagem do post',
      'Campos "Assistindo agora" e "Lendo agora" na edição de perfil com cards no perfil público',
      'Modal de busca de mídia reutilizável com debounce e cache compartilhado',
    ],
  },
  {
    version: 'v0.6',
    date:    'Mai 2026',
    title:   'Last.fm, temas e qualidade de vida',
    items: [
      'Integração com Last.fm: botão "Ouvindo agora" preenche o post com faixa atual',
      'Widget de músicas recentes na página de perfil',
      'Tema claro/escuro com toggle na nav mobile e na tela de login',
      'Badge de notificações atualizado instantaneamente ao marcar todas como lidas',
      'Câmera frontal e traseira no compositor de posts',
      'Validação de email e usuário duplicados no cadastro',
      'Opção de excluir conta com confirmação',
    ],
  },
  {
    version: 'v0.5',
    date:    'Abr 2026',
    title:   'Incelicar, hashtags e Explorar',
    items: [
      'Incelicar: repost com comentário opcional (quote repost)',
      'Hashtags por categoria: #Anime, #BBB, #Música, #Série, #Filme, #Livro',
      'Página Explorar com filtros por hashtag e posts em destaque',
      'Contagem de reposts exibida nos posts',
    ],
  },
  {
    version: 'v0.4',
    date:    'Mar 2026',
    title:   'Stories',
    items: [
      'Stories com expiração automática de 24 horas',
      'Barra de stories com avatares no topo do feed',
      'Visualização em tela cheia com barra de progresso e navegação por toque',
      'Marcar stories como vistos e deletar os próprios stories',
      'Gradiente animado no avatar quando há story ativo',
    ],
  },
  {
    version: 'v0.3',
    date:    'Fev 2026',
    title:   'Comentários e notificações',
    items: [
      'Sistema de comentários com respostas aninhadas e curtidas',
      'Central de notificações com badge de não lidas em tempo real',
      'Polling de 15s + atualização instantânea via evento customizado',
      'Textos de notificação no estilo incelicas ("te incelicou", "derramou o chá"…)',
    ],
  },
  {
    version: 'v0.2',
    date:    'Jan 2026',
    title:   'Vibe Check e perfis',
    items: [
      'Vibe Check: 5 reações únicas — Serving 🔥, Morrei 💀, Iconic 👑, Chá ☕, No Hype 🌊',
      'Páginas de perfil com avatar, bio, stats e grid de posts',
      'Seguir e deixar de seguir usuários com contagem em tempo real',
      'Modal de lista de seguidores e seguindo',
      'Badge de verificado para membros especiais',
    ],
  },
  {
    version: 'v0.1',
    date:    'Dez 2025',
    title:   'Feed inicial',
    items: [
      'Feed principal com posts de texto, imagem, GIF e vídeo',
      'Compositor de posts com upload da galeria e câmera',
      'Embed de Spotify e YouTube nos posts',
      'Autenticação com email e senha via Supabase',
      'Sidebar com trending tags e sugestões de quem seguir',
      'Layout responsivo mobile-first com nav inferior',
    ],
  },
]

export const COMING_SOON: string[] = [
  'Mensagens diretas entre usuários',
  'Editar post após publicar',
  'Busca de posts e conteúdo',
  'Notificações push (Web Push API)',
  'Salvar posts para ver depois',
  'PWA — instalar como app no celular',
]
