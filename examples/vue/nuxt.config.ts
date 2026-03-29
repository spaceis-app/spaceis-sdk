export default defineNuxtConfig({
  compatibilityDate: '2026-03-29',
  css: ['~/assets/styles.css'],
  runtimeConfig: {
    public: {
      spaceisApiUrl: 'https://storefront-api.spaceis.app',
      spaceisShopUuid: '',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap',
        },
      ],
    },
  },
});
