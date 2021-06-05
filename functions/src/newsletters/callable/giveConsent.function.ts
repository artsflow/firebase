import * as functions from 'firebase-functions'

import { db } from '../../config'

export const giveConsent = functions.region('europe-west2').https.onCall(async (data, context) => {
  const userId = context.auth?.uid

  if (!userId) return false

  const profileRef = db.collection('users').doc(userId)

  return profileRef.update({ hasConsent: true })
})
