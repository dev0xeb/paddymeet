'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function signUpExplorer(formData: {
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  username: string
  password: string
  gender: string
  state: string
  city: string
  interests: string[]
}) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: `${formData.firstName} ${formData.lastName}`,
        account_type: 'explorer',
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      username: formData.username.replace('@', ''),
      full_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      age: formData.age,
      gender: formData.gender,
      city: formData.city,
      state: formData.state,
      trust_score: 50,
      tier: 'Newbie',
      referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    })

  if (profileError) {
    return { error: profileError.message }
  }

  if (formData.interests.length > 0) {
    await supabase
      .from('user_interests')
      .insert(
        formData.interests.map(interest => ({
          user_id: authData.user!.id,
          interest,
        }))
      )
  }

  redirect('/dashboard')
}

export async function signUpOrganiser(formData: {
  orgName: string
  contactName: string
  role: string
  email: string
  phone: string
  password: string
  website: string
  description: string
  eventTypes: string[]
}) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.contactName,
        account_type: 'organiser',
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const { error: orgError } = await supabase
    .from('organisers')
    .insert({
      id: authData.user.id,
      org_name: formData.orgName,
      contact_name: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      description: formData.description,
      is_verified: false,
      is_active: false,
    })

  if (orgError) {
    return { error: orgError.message }
  }

  if (formData.eventTypes.length > 0) {
    await supabase
      .from('organiser_event_types')
      .insert(
        formData.eventTypes.map(type => ({
          organiser_id: authData.user!.id,
          event_type: type,
        }))
      )
  }

  return { success: true }
}