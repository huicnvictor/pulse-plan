import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neumo: {
          bg: '#E4E9F0',
          dark: '#BEC8D4',
          light: '#FFFFFF',
          accent: '#667eea',
          text: '#2d3748',
          muted: '#718096',
          subtle: '#a0aec0',
        },
      },
      boxShadow: {
        'neumo':       '8px 8px 16px #BEC8D4, -8px -8px 16px #FFFFFF',
        'neumo-sm':    '5px 5px 10px #BEC8D4, -5px -5px 10px #FFFFFF',
        'neumo-xs':    '3px 3px 6px #BEC8D4, -3px -3px 6px #FFFFFF',
        'neumo-inset': 'inset 5px 5px 10px #BEC8D4, inset -5px -5px 10px #FFFFFF',
        'neumo-press': 'inset 3px 3px 6px #BEC8D4, inset -3px -3px 6px #FFFFFF',
        'neumo-accent': '0 4px 14px rgba(102, 126, 234, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
