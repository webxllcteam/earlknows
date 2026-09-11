import type { CollectionConfig } from 'payload'

/**
 * The aggregate page for a whole metro — /[market]/[service].
 * People really do search "roofers in the treasure valley", and a market with
 * no page can't capture that.
 *
 * Not billable. The contractors shown are the union of that market's city
 * listings; this record only owns the words. Hold it unpublished until at least
 * two cities are live, or it's just a duplicate of its only child.
 */
export const MarketPages: CollectionConfig = {
  slug: 'market-pages',
  labels: { singular: 'Market page', plural: 'Market pages' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'status'],
    description: 'Metro-wide pages that aggregate the city listings beneath them.',
    group: 'Content',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const serviceId = typeof data.service === 'object' ? data.service?.id : data.service
        const marketId = typeof data.market === 'object' ? data.market?.id : data.market
        if (serviceId && marketId) {
          try {
            const [service, market] = await Promise.all([
              req.payload.findByID({ collection: 'services', id: serviceId, depth: 0 }),
              req.payload.findByID({ collection: 'markets', id: marketId, depth: 0 }),
            ])
            data.label = `${service.name} — ${market.name}, ${market.state}`
          } catch {
            /* leave the existing label */
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar', description: 'Generated automatically.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft — not published', value: 'draft' },
        { label: 'Live', value: 'live' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Keep as draft until two or more cities in this market are live — otherwise it duplicates its only child.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'market',
          type: 'relationship',
          relationTo: 'markets',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
      admin: { description: 'Under ~60 characters.' },
    },
    { name: 'metaDescription', type: 'textarea', admin: { description: 'Under ~155 characters.' } },
    {
      name: 'intro',
      type: 'richText',
      admin: {
        description:
          'Write about the metro, not one town — coverage across the valley, how to choose between areas, what varies by part of the region.',
      },
    },
    {
      name: 'faqs',
      type: 'array',
      admin: { description: 'Published as FAQPage schema.' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}
