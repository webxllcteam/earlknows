import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug', 'active'],
    description: 'Categories (Roofing) and their sub-services (Metal roofing). Contractors subscribe to a category; sub-services control which pages they show on.',
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
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'services',
      // Only top-level services can be parents — two levels, no deeper.
      filterOptions: () => ({ parent: { exists: false } }),
      admin: {
        position: 'sidebar',
        description:
          'Leave empty for a category (Roofing). Set it to make this a sub-service (Metal roofing). Billing happens at the category level.',
      },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
