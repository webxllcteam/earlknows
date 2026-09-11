import type { CollectionConfig } from 'payload'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'state', 'slug', 'active'],
    description: 'Markets Earl operates in. Each becomes a /[city]/ hub page.',
    group: 'Catalog',
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Boise' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL segment — e.g. "boise".' },
    },
    {
      type: 'row',
      fields: [
        { name: 'state', type: 'text', required: true, defaultValue: 'ID', admin: { width: '30%' } },
        { name: 'county', type: 'text', admin: { width: '70%', description: 'e.g. Ada County' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'lat', type: 'number', admin: { width: '50%' } },
        { name: 'lng', type: 'number', admin: { width: '50%' } },
      ],
    },
    {
      name: 'nearby',
      type: 'relationship',
      relationTo: 'cities',
      hasMany: true,
      admin: { description: 'Neighbouring markets to cross-link. Helps authority circulate.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
