import * as functions from 'firebase-functions'

import { stripe, ARTSFLOW_APP_URL } from '../../config'

export const createStripeAccountLinks = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('createStripeAccountLinks!!', data)
    const userId = context.auth?.uid
    const { stripeAccountId } = data

    if (!userId || !stripeAccountId) return false

    const accountLinks = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: ARTSFLOW_APP_URL,
      return_url: `${ARTSFLOW_APP_URL}/return`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    })

    return accountLinks
  })
