'use server'

import { redirect } from 'next/navigation'
import { payloadClient } from '@/lib/payload'

/**
 * Round-robin, not random: route to whichever provider on the panel has
 * received fewest leads this calendar month. Random is lumpy at low volume —
 * 3 providers and 10 leads can land 6/3/1.
 */
async function pickProvider(providerIds: number[]): Promise<number | undefined> {
  if (providerIds.length === 0) return undefined
  if (providerIds.length === 1) return providerIds[0]

  const payload = await payloadClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const recent = await payload.find({
    collection: 'leads',
    where: {
      and: [
        { provider: { in: providerIds } },
        { createdAt: { greater_than_equal: monthStart.toISOString() } },
      ],
    },
    depth: 0,
    limit: 1000,
  })

  const counts = new Map<number, number>(providerIds.map((id) => [id, 0]))
  for (const lead of recent.docs) {
    const id = typeof lead.provider === 'object' ? lead.provider?.id : lead.provider
    if (typeof id === 'number' && counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0]
}

export async function submitLead(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? '').trim()

  const name = get('name')
  const phone = get('phone')
  const servicePath = get('servicePath')
  const cityPath = get('cityPath')

  if (!name || !phone) redirect(`/${servicePath}/${cityPath}?error=missing`)

  const providerIds = get('providerIds')
    .split(',')
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0)

  const providerId = await pickProvider(providerIds)

  const payload = await payloadClient()
  await payload.create({
    collection: 'leads',
    data: {
      name,
      phone,
      email: get('email') || undefined,
      zip: get('zip') || undefined,
      message: get('message') || undefined,
      service: Number(get('serviceId')) || undefined,
      city: Number(get('cityId')) || undefined,
      provider: providerId,
      sourcePage: `/${servicePath}/${cityPath}`,
      status: 'new',
    },
  })

  redirect(`/${servicePath}/${cityPath}?sent=1`)
}
