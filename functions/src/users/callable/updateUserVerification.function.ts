import * as functions from 'firebase-functions'

import { db, serverTimestamp } from '../../config'
import { getStripeAccount } from '../../utils'

export const updateUserVerification = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
  })
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAccount = (await getStripeAccount(userId)) as any

    if (!stripeAccount) return null

    const isVerified =
      stripeAccount?.capabilities?.card_payments === 'active' &&
      stripeAccount?.capabilities?.transfers === 'active' &&
      stripeAccount?.requirements?.pending_verification?.length === 0 &&
      stripeAccount?.requirements?.errors?.length === 0

    if (isVerified) {
      const userRef = db.doc(`users/${userId}`)
      const profileRef = db.doc(`profiles/${userId}`)
      const batch = db.batch()

      const verifiedData = {
        verifiedAt: serverTimestamp(),
        isVerified: true,
      }

      // TODO: create postmark server for newsletters

      batch.update(userRef, verifiedData)
      batch.update(profileRef, verifiedData)
      return batch.commit()
    }

    return true
  })
