'use server'

import { redirect } from 'next/navigation'
import { payloadClient } from '@/lib/payload'

/**
 * Capture the application either way. If the panel for that trade and metro is
 * already at its cap, it lands as `waitlisted` rather than being turned away —
 * waitlist volume tells us where the cap or the price is too low.
 */
export async function submitApplication(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? '').trim()

  const businessName = get('businessName')
  const phone = get('phone')
  const email = get('email')
  const serviceId = Number(get('serviceId')) || undefined
  const marketId = Number(get('marketId')) || undefined

  const qs = new URLSearchParams()
  if (get('placeSlug')) qs.set('place', get('placeSlug'))
  if (get('serviceSlug')) qs.set('service', get('serviceSlug'))

  if (!businessName || !phone || !email) {
    qs.set('error', 'missing')
    redirect(`/apply?${qs}`)
  }

  const payload = await payloadClient()

  // Is that panel already full?
  let status: 'new' | 'waitlisted' = 'new'
  if (serviceId && marketId) {
    const listings = await payload.find({
      collection: 'listings',
      where: { and: [{ service: { equals: serviceId } }, { market: { equals: marketId } }] },
      depth: 0,
      limit: 1,
    })
    const listing = listings.docs[0]
    if (listing) {
      const taken = Array.isArray(listing.providers) ? listing.providers.length : 0
      if (taken >= (listing.maxProviders ?? 3)) status = 'waitlisted'
    }
  }

  await payload.create({
    collection: 'applications',
    data: {
      status,
      businessName,
      contactName: get('contactName') || undefined,
      phone,
      email,
      website: get('website') || undefined,
      service: serviceId,
      market: marketId,
      licenseNumber: get('licenseNumber') || undefined,
      yearsInBusiness: Number(get('yearsInBusiness')) || undefined,
      message: get('message') || undefined,
    },
  })

  qs.set('sent', status)
  redirect(`/apply?${qs}`)
}
