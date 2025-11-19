/**
 * MMQ Vite Integration Plugin
 *
 * Simplifies Module Federation setup for consuming Vite apps.
 *
 * @example
 * ```typescript
 * import { mmqPlugin } from '@sis-thesqd/mmq/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     mmqPlugin({
 *       remoteUrl: 'https://mmq-modular.vercel.app',
 *       // Optional: override defaults
 *       cssUrl: 'https://custom-cdn.com/mmq.css',
 *     }),
 *   ],
 * })
 * ```
 */

import { federation } from '@module-federation/vite';
import type { Plugin } from 'vite';

export interface MMQPluginOptions {
  /** URL of the remote MMQ deployment (without trailing slash) */
  remoteUrl?: string;
  /** Custom CSS URL (auto-detected if not provided) */
  cssUrl?: string;
  /** Additional shared dependencies */
  shared?: Record<string, any>;
  /** Enable proxy for API routes */
  enableProxy?: boolean;
}

const DEFAULT_REMOTE_URL = 'https://mmq-modular.vercel.app';

/**
 * Vite plugin that configures Module Federation and CSS loading for MMQ
 */
export function mmqPlugin(options: MMQPluginOptions = {}): Plugin[] {
  const {
    remoteUrl = DEFAULT_REMOTE_URL,
    enableProxy = true,
    shared = {},
  } = options;

  return [
    federation({
      name: 'mmqConsumer',
      remotes: {
        mmq: `mmq@${remoteUrl}/_next/static/chunks/remoteEntry.js`,
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        ...shared,
      },
    }),
    // Auto-inject CSS loader
    {
      name: 'mmq-css-loader',
      apply: 'serve',
      transformIndexHtml(html) {
        const cssUrl = options.cssUrl || `${remoteUrl}/_next/static/css/app.css`;
        return html.replace(
          '</head>',
          `  <link rel="stylesheet" href="${cssUrl}" data-mmq-styles />\n</head>`
        );
      },
    },
    // Optional: Configure proxy
    ...(enableProxy
      ? [
          {
            name: 'mmq-api-proxy',
            config() {
              return {
                server: {
                  proxy: {
                    '/api/mmq-queue-data': {
                      target: remoteUrl,
                      changeOrigin: true,
                      secure: true,
                    },
                    '/api/mmq-reorder': {
                      target: remoteUrl,
                      changeOrigin: true,
                      secure: true,
                    },
                    '/api/mmq-play-pause': {
                      target: remoteUrl,
                      changeOrigin: true,
                      secure: true,
                    },
                  },
                },
              };
            },
          } as Plugin,
        ]
      : []),
  ];
}
