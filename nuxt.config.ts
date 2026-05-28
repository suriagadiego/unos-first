export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  nitro: { preset: 'cloudflare-pages' },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  components: {
    dirs: [{ path: '~/components', pathPrefix: false }],
  },
  runtimeConfig: {
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'change-this-secret-before-deploying',
  },
  app: {
    head: {
      title: "Uno's First — Fast One",
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Dancing+Script:wght@600&display=swap',
        },
      ],
    },
  },
})
