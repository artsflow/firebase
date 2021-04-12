import * as functions from 'firebase-functions'

import { stripe, artsflowUrl } from '../../config'
import { getStripeAccount } from '../utils'

export const getStripeAccountStatus = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('getStripeAccountStatus!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAcc = await getStripeAccount(userId)

    if (!stripeAcc) return null

    // console.log(stripeAcc.requirements, stripeAcc.capabilities)

    const verified =
      stripeAcc?.capabilities?.card_payments === 'active' &&
      stripeAcc?.capabilities?.transfers === 'active' &&
      stripeAcc?.requirements?.pending_verification?.length === 0

    if (verified) {
      return {
        verified,
        payouts_enabled: stripeAcc.payouts_enabled,
        requirements: stripeAcc.requirements,
      }
    }

    const accountLinks = await stripe.accountLinks.create({
      account: stripeAcc.id,
      refresh_url: artsflowUrl,
      return_url: artsflowUrl,
      type: 'account_onboarding',
      collect: 'eventually_due',
    })

    return {
      verified,
      onboardingUrl: accountLinks.url,
      payouts_enabled: stripeAcc.payouts_enabled,
      requirements: stripeAcc.requirements,
    }
  })
