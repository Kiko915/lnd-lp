// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lndliliw.online',
  integrations: [
    tailwind(), 
    sitemap({ 
      filter: (page) => !page.includes("/admin"), 
      changefreq: 'weekly',
      priority: 0.7
    }),  
  ],
  output: 'server',
  adapter: netlify(),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        quality: 80,
        formats: ['webp', 'avif'],
        cache: true,
        cacheDir: './node_modules/.sharp-cache'
      }
    },
    domains: ['lndliliw.online'],
    remotePatterns: [{ protocol: "https" }]
  },
  server: {
    headers: {
      // Content Security Policy
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://lndliliw.online https://*.lndliliw.online https://us.posthog.com https://identity.netlify.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; img-src 'self' data: https://lndliliw.online https://*.cloudinary.com https://*.fbcdn.net https://cloud.appwrite.io; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://lndliliw.online https://us.posthog.com https://api.netlify.com; frame-src 'self' https://identity.netlify.com https://lndliliw.instatus.com https://*.google.com https://www.google.com; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests",
      
      // Security Headers
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      
      // CORS Headers
      "Access-Control-Allow-Origin": "https://lndliliw.online",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Resource-Policy": "same-site",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  }
});