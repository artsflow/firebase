import * as functions from 'firebase-functions'

import { stripe, ARTSFLOW_APP_URL } from '../../config'
import { getOrCreateStripeAccount } from '../../utils'

export const createStripeAccountLinks = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('createStripeAccountLinks!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAccount = await getOrCreateStripeAccount(userId)

    const accountLinks = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: ARTSFLOW_APP_URL,
      return_url: `${ARTSFLOW_APP_URL}/return`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    })

    return accountLinks
  })
