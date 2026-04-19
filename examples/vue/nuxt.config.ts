// CSP without nonces — pragmatic middle ground. Blocks clickjacking, base-tag
// injection, form-action exfiltration and legacy <object> attacks. Does NOT
// give real XSS defence (script-src allows 'unsafe-inline' + 'unsafe-eval' so
// Nuxt HMR/hydration scripts keep working) — XSS is handled via DOMPurify on
// CMS-authored HTML (product description, page content, statute).
const API_ORIGIN =
  process.env.NUXT_PUBLIC_SPACEIS_API_URL || 'https://storefront-api.spaceis.app';

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' ${API_ORIGIN}`,
  // reCAPTCHA v3 needs google domains for iframe + scripts
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
  "frame-src https://www.google.com",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default defineNuxtConfig({
  compatibilityDate: '2026-03-29',
  css: ['~/assets/styles.css'],
  // Feature-based folder layout under components/ — pathPrefix:false so
  // Nuxt keeps auto-imported names short (e.g. <CartDrawer>, not <CartCartDrawer>)
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    public: {
      spaceisApiUrl: 'https://storefront-api.spaceis.app',
      spaceisShopUuid: '',
      returnUrl: '',
      cancelUrl: '',
    },
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: SECURITY_HEADERS,
      },
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
