import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#FFF5F0',
          100: '#FFE9DC',
          200: '#FFD7BF',
          300: '#FFC4A3',
        },
        rose: {
          50: '#FFF1F5',
        },
      },
      boxShadow: {
        soft: '0 10px 25px rgba(255, 196, 163, 0.25)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}
export default config

