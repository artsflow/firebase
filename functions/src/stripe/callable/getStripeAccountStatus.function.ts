import * as functions from 'firebase-functions'

import { db, stripe, artsflowUrl } from '../../config'

export const getStripeAccountStatus = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('getStripeAccountStatus!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const profileRef = db.collection('profiles').doc(userId)
    const doc = await profileRef.get()
    const sid = doc.data()?.sid

    const stripeAcc = await stripe.accounts.retrieve(sid)

    // console.log(stripeAcc)

    if (
      stripeAcc.capabilities?.card_payments == 'active' &&
      stripeAcc.capabilities?.transfers == 'active'
    ) {
      return { verified: true }
    }

    const accountLinks = await stripe.accountLinks.create({
      account: sid,
      refresh_url: artsflowUrl,
      return_url: artsflowUrl,
      type: 'account_onboarding',
      collect: 'eventually_due',
    })

    return {
      verified: false,
      onboardingUrl: accountLinks.url,
    }
  })
