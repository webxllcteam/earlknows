import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const payloadClient = async () => getPayload({ config: configPromise })

export const SITE_NAME = 'Earl Knows'
export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
