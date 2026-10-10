import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Awards the referrer their discount the first time a referred user's
 * ticket purchase completes. Shared so every ticket-fulfillment path
 * (direct verify, free claim, and the Paystack webhook) applies this the
 * same way — this used to be copy-pasted into two of the three and simply
 * missing from the third, so referred users fulfilled via the webhook
 * never triggered their referrer's reward.
 */
export async function awardReferralDiscount(
  supabase: SupabaseClient,
  user_id: string
) {
  const { data: profile } = await supabase
    .from('users')
    .select('referred_by, referral_converted')
    .eq('id', user_id)
    .single()

  if (!profile?.referred_by || profile.referral_converted) return

  // Count orders, not ticket rows — a single first purchase can create many
  // ticket rows at once (quantity > 1, or any group ticket, which always
  // inserts group_size rows), which made the old ticket-row count look like
  // a repeat purchase and silently skip the reward on the very first order.
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)

  if ((count ?? 0) > 1) return

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('referral_discount_percent')
    .eq('id', 1)
    .single()

  const discount = settings?.referral_discount_percent ?? 10

  await supabase
    .from('users')
    .update({ referral_discount_percent: discount, referral_converted: true })
    .eq('id', profile.referred_by)

  await supabase
    .from('users')
    .update({ referral_converted: true })
    .eq('id', user_id)

  await supabase.from('notifications').insert({
    user_id: profile.referred_by,
    title: 'Referral reward unlocked! 🎁',
    message: `A friend you referred just got their first ticket. You have earned a ${discount}% discount on your next ticket purchase.`,
    type: 'referral',
    is_read: false,
  })
}
