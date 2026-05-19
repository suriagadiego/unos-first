import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
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
        racing: ['"Racing Sans One"', 'cursive'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
} satisfies Config
