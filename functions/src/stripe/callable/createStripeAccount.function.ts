import * as functions from 'firebase-functions'

import { db, stripe } from '../../config'

export const createStripeAccount = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('createStripeAccount!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const userRef = db.collection('users').doc(userId)
    const profileRef = db.collection('profiles').doc(userId)
    const userDoc = await userRef.get()
    const email = userDoc.data()?.email

    const stripeAccount = await stripe.accounts.create({
      country: 'GB',
      type: 'custom',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      email,
      metadata: {
        userId,
      },
    })

    const stripeAccountId = stripeAccount.id

    const batch = db.batch()

    batch.update(userRef, { stripeAccountId, isVerified: false })
    batch.update(profileRef, { isVerified: false })

    await batch.commit()

    return stripeAccountId
  })
