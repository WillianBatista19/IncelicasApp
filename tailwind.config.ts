import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      colors: {
        pink: {
          DEFAULT: '#D4537E',
          hover:   '#c0466e',
          muted:   '#D4537E33',
        },
        purple: {
          DEFAULT: '#7F77DD',
          muted:   '#7F77DD33',
        },
        teal: {
          DEFAULT: '#1D9E75',
          muted:   '#1D9E7533',
        },
      },
      backgroundImage: {
        'auth-radial':
          'radial-gradient(ellipse 80% 60% at 50% 0%, #2a0d1a 0%, #0c0c0f 60%)',
      },
    },
  },
  plugins: [],
}

export default config
