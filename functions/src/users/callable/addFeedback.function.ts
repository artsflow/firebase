import * as functions from 'firebase-functions'

import { db, serverTimestamp } from '../../config'

export const addFeedback = functions.region('europe-west2').https.onCall(async (data, context) => {
  const userId = context.auth?.uid

  if (!userId) return false

  return db.collection('feedback').add({ ...data, createdAt: serverTimestamp() })
})
