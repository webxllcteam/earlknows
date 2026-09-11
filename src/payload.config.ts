import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Applications } from './collections/Applications'
import { Cities } from './collections/Cities'
import { Leads } from './collections/Leads'
import { Markets } from './collections/Markets'
import { Media } from './collections/Media'
import { Providers } from './collections/Providers'
import { Services } from './collections/Services'
import { Territories } from './collections/Territories'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Earl Knows' },
  },
  collections: [Services, Markets, Cities, Providers, Territories, Applications, Leads, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  sharp,
})
