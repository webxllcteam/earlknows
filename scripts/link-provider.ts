import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const territories = await payload.find({ collection: 'territories', limit: 10, depth: 0 })
const providers = await payload.find({ collection: 'providers', limit: 10, depth: 0 })

const territory = territories.docs[0]
const provider = providers.docs[0]

if (!territory || !provider) {
  console.log('nothing to link')
  process.exit(0)
}

await payload.update({
  collection: 'territories',
  id: territory.id,
  data: { providers: [provider.id] },
})

console.log(`linked "${provider.businessName}" to "${territory.label}"`)
process.exit(0)
