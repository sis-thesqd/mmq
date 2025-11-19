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
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
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
 */
async function findLatestCSSFile(): Promise<string> {
  try {
    // In Vercel/production, use environment variable or fallback
    if (process.env.VERCEL_ENV) {
      // Try to read from build manifest
      const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json');
      if (fs.existsSync(buildManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf-8'));
        // Extract CSS file from manifest
        const cssFiles = Object.values(manifest.pages)
          .flat()
          .filter((file: any) => typeof file === 'string' && file.endsWith('.css'))
          .map((file: any) => file.replace('static/css/', ''));

        if (cssFiles.length > 0) {
          return cssFiles[0] as string;
        }
      }
    }

    // Fallback: scan the CSS directory
    const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
    if (fs.existsSync(cssDir)) {
      const files = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
      if (files.length > 0) {
        // Return the first CSS file found
        return files[0];
      }
    }

    // Final fallback to known working file
    return '77ecdc29b68b0c62.css';
  } catch (error) {
    console.error('[findLatestCSSFile] Error:', error);
    return '77ecdc29b68b0c62.css';
  }
}
