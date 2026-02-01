// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import remarkDirective from 'remark-directive';
import { remarkHighlight } from './src/plugins/remark-highlight.mjs';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerNotationErrorLevel
} from '@shikijs/transformers';

// https://astro.build/config
export default defineConfig({
  site: 'https://tech-lessons.in',
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkDirective, remarkHighlight],
    }),
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [remarkDirective, remarkHighlight],
    shikiConfig: {
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationErrorLevel(),
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});