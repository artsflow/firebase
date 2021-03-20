import * as functions from 'firebase-functions'

import { db } from '../../config'

export const setActivityStatus = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('setActivityStatus!!', data)
    const userId = context.auth?.uid

    if (!userId) return false

    const { id, status } = data
    const activityRef = db.collection('activities').doc(id)
    const doc = await activityRef.get()

    if (userId !== doc.data()?.userId) return false

    return activityRef.set({ status }, { merge: true })
  })
