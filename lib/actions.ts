export type UpdateAlertSubscriptionInput = {
  id: string
  name?: string
  keywords?: string
  setAside?: string
  placeOfPerformance?: string
  procurementType?: string
  naics?: string
  deliveryTime?: string
  format?: string
  isActive?: boolean
  frequency?: string
}

export async function updateAlertSubscription(input: UpdateAlertSubscriptionInput) {
  console.log('📝 updateAlertSubscription called with:', input)
  
  const url = `/api/alert-subscriptions/${encodeURIComponent(input.id)}`
  console.log('📝 Making PATCH request to:', url)
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  console.log('📝 Response status:', res.status)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('❌ Update failed:', { status: res.status, text })
    throw new Error(`Failed to update subscription (${res.status}): ${text}`)
  }

  const data = await res.json().catch(() => ({}))
  console.log('✅ Update successful:', data)
  return data
}

export async function deleteAlertSubscription(id: string) {
  console.log('🗑️ deleteAlertSubscription called with id:', id)
  
  const url = `/api/alert-subscriptions/${encodeURIComponent(id)}`
  console.log('🗑️ Making DELETE request to:', url)
  
  try {
    const res = await fetch(url, {
      method: 'DELETE',
    })

    console.log('🗑️ Response status:', res.status)
    console.log('🗑️ Response ok:', res.ok)
    console.log('🗑️ Response headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('❌ Delete failed:', { status: res.status, text })
      throw new Error(`Failed to delete subscription (${res.status}): ${text}`)
    }

    const data = await res.json().catch((e) => {
      console.warn('⚠️ Could not parse JSON response:', e)
      return {}
    })
    
    console.log('✅ Delete response data:', data)
    return data
  } catch (error) {
    console.error('❌ Delete threw exception:', error)
    throw error
  }
}