import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  safelist: [
    'bg-amber-100', 'bg-amber-400',
    'border-amber-200', 'border-amber-300', 'border-amber-400',
    'text-amber-600', 'text-amber-700',
  ],
  theme: {
    extend: {
      colors: {
        'race-blue': '#6B8CAE',
        'race-blue-light': '#A8C5DA',
        'race-gray': '#4A4A4A',
        'race-black': '#0D0D0D',
      },
      fontFamily: {
        racing: ['Formula1', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
    },
  },
} satisfies Config
