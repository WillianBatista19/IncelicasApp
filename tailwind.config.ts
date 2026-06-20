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
        // Override zinc palette to read from CSS variables so the light/dark
        // theme toggle works by just flipping the variable values on <html>.
        // The `<alpha-value>` token lets opacity modifiers (bg-zinc-900/60) keep working.
        zinc: {
          50:  'rgb(var(--zinc-50)  / <alpha-value>)',
          100: 'rgb(var(--zinc-100) / <alpha-value>)',
          200: 'rgb(var(--zinc-200) / <alpha-value>)',
          300: 'rgb(var(--zinc-300) / <alpha-value>)',
          400: 'rgb(var(--zinc-400) / <alpha-value>)',
          500: 'rgb(var(--zinc-500) / <alpha-value>)',
          600: 'rgb(var(--zinc-600) / <alpha-value>)',
          700: 'rgb(var(--zinc-700) / <alpha-value>)',
          800: 'rgb(var(--zinc-800) / <alpha-value>)',
          900: 'rgb(var(--zinc-900) / <alpha-value>)',
          950: 'rgb(var(--zinc-950) / <alpha-value>)',
        },
      },
      backgroundImage: {
        'auth-radial': 'var(--auth-radial)',
      },
    },
  },
  plugins: [],
}

export default config
