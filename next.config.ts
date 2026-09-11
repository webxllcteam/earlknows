import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Never try plain HTTP for this domain again. Closes the window on
            // a first visit where the 301 redirect happens over HTTP.
            // Add `; preload` and submit to hstspreload.org once you're sure —
            // getting off the preload list is slow.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            // Clickjacking. SAMEORIGIN rather than DENY so Payload's admin can
            // still frame its own previews.
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Stop browsers guessing a content type and executing an upload as
            // something it isn't.
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Camera and mic are never needed. Geolocation is deliberately left
            // alone — we may use it to suggest a nearby market.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=()',
          },
        ],
      },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
