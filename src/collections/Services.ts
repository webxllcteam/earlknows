import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'active'],
    description: 'The trades Earl covers. Each one becomes a /[slug]/ hub page.',
    group: 'Catalog',
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Roofing' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL segment. Lowercase, hyphens only — e.g. "roofing".' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      admin: { description: 'One sentence. Used in listings and meta descriptions.' },
    },
    {
      name: 'intro',
      type: 'richText',
      admin: { description: 'Opening copy for the national /[service]/ hub page.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 100,
      admin: { description: 'Lower numbers appear first.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
