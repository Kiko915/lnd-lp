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
  }
});