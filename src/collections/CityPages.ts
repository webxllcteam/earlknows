import type { CollectionConfig } from 'payload'

/**
 * A town-level page — /[city]/[service]. People search "roofer boise" far more
 * than they search the metro, so these capture the volume.
 *
 * Not billable, and it does not own a panel: the contractors shown are whoever
 * is on the market's Listing. What it owns is its own words, which is the only
 * thing that keeps ten city pages from being ten near-duplicates.
 *
 * Don't create one you can't write real local content for.
 */
export const CityPages: CollectionConfig = {
  slug: 'city-pages',
  labels: { singular: 'City page', plural: 'City pages' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'status'],
    description: 'Town pages. Each needs genuinely local content — see CLAUDE.md on doorway pages.',
    group: 'Content',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const serviceId = typeof data.service === 'object' ? data.service?.id : data.service
        const cityId = typeof data.city === 'object' ? data.city?.id : data.city
        if (serviceId && cityId) {
          try {
            const [service, city] = await Promise.all([
              req.payload.findByID({ collection: 'services', id: serviceId, depth: 0 }),
              req.payload.findByID({ collection: 'cities', id: cityId, depth: 0 }),
            ])
            data.label = `${service.name} — ${city.name}, ${city.state}`
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
          'Publish only once this page says something a neighbouring town\'s page would not.',
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
          name: 'city',
          type: 'relationship',
          relationTo: 'cities',
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
          'Write about THIS town: permit office, housing stock, what fails here, named neighbourhoods. If deleting the city name leaves nothing unique, it is a doorway page.',
      },
    },
    {
      name: 'localNotes',
      type: 'richText',
      admin: {
        description: 'The part nobody can copy — local conditions, rules, real examples.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'priceLow', type: 'number', admin: { width: '50%' } },
        { name: 'priceHigh', type: 'number', admin: { width: '50%' } },
      ],
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
