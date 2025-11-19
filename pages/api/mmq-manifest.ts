import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface MMQManifest {
  version: string;
  cssUrl: string;
  remoteEntryUrl: string;
  timestamp: string;
}

/**
 * MMQ Manifest API - Returns current CSS and remote entry URLs
 *
 * This endpoint allows consuming apps to dynamically discover the correct
 * CSS file URL without hardcoding the hash-based filename.
 *
 * GET /api/mmq-manifest
 *
 * Response:
 * {
 *   "version": "1.0.0",
 *   "cssUrl": "https://mmq-modular.vercel.app/_next/static/css/77ecdc29b68b0c62.css",
 *   "remoteEntryUrl": "https://mmq-modular.vercel.app/_next/static/chunks/remoteEntry.js",
 *   "timestamp": "2025-11-19T18:00:00.000Z"
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MMQManifest | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Always use production URL (not preview URLs)
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://mmq-modular.vercel.app';

    // In production, Next.js generates a build manifest
    // We'll scan the .next directory for CSS files
    const cssFile = await findLatestCSSFile();

    const manifest: MMQManifest = {
      version: process.env.npm_package_version || '1.0.0',
      cssUrl: `${baseUrl}/_next/static/css/${cssFile}`,
      remoteEntryUrl: `${baseUrl}/_next/static/chunks/remoteEntry.js`,
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour in production, 0 in development
    const cacheMaxAge = process.env.NODE_ENV === 'production' ? 3600 : 0;
    res.setHeader('Cache-Control', `public, s-maxage=${cacheMaxAge}, stale-while-revalidate`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    return res.status(200).json(manifest);
  } catch (error) {
    console.error('[mmq-manifest] Error:', error);

    // Fallback to known working CSS file
    const baseUrl = 'https://mmq-modular.vercel.app';
    const manifest: MMQManifest = {
      version: '1.0.0',
      cssUrl: `${baseUrl}/_next/static/css/77ecdc29b68b0c62.css`,
      remoteEntryUrl: `${baseUrl}/_next/static/chunks/remoteEntry.js`,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(manifest);
  }
}

/**
 * Find the latest CSS file in the build directory
 * Returns the filename (not full path)
 *
 * Strategy:
 * 1. Read Next.js build manifest
 * 2. Extract CSS files from pages entries
 * 3. Return the app-level CSS (not page-specific)
 */
async function findLatestCSSFile(): Promise<string> {
  try {
    // Read Next.js build manifest
    const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json');

    if (fs.existsSync(buildManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf-8'));

      // Look for CSS in the pages manifest
      // Next.js structure: { pages: { '/': ['static/css/xxx.css', ...], ... } }
      for (const [page, files] of Object.entries(manifest.pages)) {
        const pageFiles = files as string[];
        for (const file of pageFiles) {
          if (file.startsWith('static/css/') && file.endsWith('.css')) {
            // Extract just the filename with hash
            return file.replace('static/css/', '');
          }
        }
      }
    }

    // Fallback: Direct filesystem scan
    const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
    if (fs.existsSync(cssDir)) {
      const files = fs.readdirSync(cssDir)
        .filter(file => file.endsWith('.css'))
        .sort((a, b) => {
          // Sort by modification time, newest first
          const statA = fs.statSync(path.join(cssDir, a));
          const statB = fs.statSync(path.join(cssDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        });

      if (files.length > 0) {
        return files[0];
      }
    }

    throw new Error('No CSS file found in build directory');
  } catch (error) {
    console.error('[findLatestCSSFile] Critical error:', error);
    throw error; // Don't fallback - let the error propagate
  }
}
