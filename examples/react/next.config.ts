import type { NextConfig } from "next";

// CSP without nonces — pragmatic middle ground. Blocks clickjacking, base-tag
// injection, form-action exfiltration and legacy <object> attacks. Does NOT
// give real XSS defence (script-src allows 'unsafe-inline' + 'unsafe-eval'
// so dev-mode React Refresh keeps working) — XSS is handled via DOMPurify on
// CMS-authored HTML (SafeHtml). For a full nonce-based CSP see middleware.ts
// docs at https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy.
const API_ORIGIN =
  process.env.NEXT_PUBLIC_SPACEIS_API_URL || "https://storefront-api.spaceis.app";

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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@spaceis/sdk", "@spaceis/react"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
