import * as functions from 'firebase-functions'

import { db } from '../../config'

export const deleteActivity = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('deleteActivity!!', data)
    const userId = context.auth?.uid

    if (!userId) return false

    const { id } = data
    const activityRef = db.collection('activities').doc(id)
    const doc = await activityRef.get()

    if (userId !== doc.data()?.userId) return false

    const locationRef = db.collection('locations').doc(id)

    const batch = db.batch()

    batch.delete(activityRef)
    batch.delete(locationRef)

    return batch.commit()
  })
