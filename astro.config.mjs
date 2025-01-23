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
  vite: {
    server: {
      headers: {
        '/assets/**': [
          'Cache-Control: public, max-age=31536000, immutable'
        ]
      }
    }
  }
});