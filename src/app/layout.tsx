import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/context/UserContext'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title:       'Zapli',
  description: 'A rede da galera — anime, BBB, música, séries, filmes e livros.',
  icons: {
    icon:     '/favicon.svg',
    shortcut: '/favicon.svg',
    apple:    '/favicon.svg',
  },
}

// Runs synchronously before first paint — sets data-theme on <html> from
// localStorage (or system preference) to prevent flash of wrong theme.
const themeScript = `(function(){try{
  var t=localStorage.getItem('theme');
  if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
  document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint: blocking script required for theme flash prevention */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
