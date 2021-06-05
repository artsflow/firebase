import * as functions from 'firebase-functions'

import { db, stripe } from '../../config'

export const createStripeAccount = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid
    const token = context.auth?.token

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    try {
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
        email: token?.email,
        metadata: {
          userId,
        },
      })

      const stripeAccountId = stripeAccount.id

      const batch = db.batch()
      const userRef = db.collection('users').doc(userId)
      const profileRef = db.collection('profiles').doc(userId)
      batch.update(userRef, { stripeAccountId, isVerified: false })
      batch.update(profileRef, { isVerified: false })
      await batch.commit()

      return stripeAccountId
    } catch (e) {
      functions.logger.error(e)
    }
    return null
  })
