import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const users = await payload.find({ collection: 'users', limit: 1 })
const user = users.docs[0]
if (!user) {
  console.log('no user found')
  process.exit(1)
}

await payload.update({
  collection: 'users',
  id: user.id,
  data: { password: 'earlknows2026' },
  overrideAccess: true,
})

console.log(`reset password for ${user.email}`)
process.exit(0)
