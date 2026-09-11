import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const payloadClient = async () => getPayload({ config: configPromise })

export const SITE_NAME = 'Earl Knows'
export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/**
 * Railway's private network only exists at runtime, so the database is
 * unreachable during the build. Rather than fail, we return no static params:
 * pages are then rendered on first request and cached by ISR (revalidate 3600).
 * Same output, just generated lazily.
 */
export async function safeStaticParams<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn()
  } catch {
    return []
  }
}
