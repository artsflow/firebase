import * as functions from 'firebase-functions'
import { omit } from 'lodash'

import { db, serverTimestamp } from '../../config'

export const editActivity = functions.region('europe-west2').https.onCall(async (data, context) => {
  console.log('editActivity!!', data)
  const userId = context.auth?.uid

  if (!userId) return false

  // TODO: should check activity data integrity
  // TODO: read activity id before and make sure it belongs user

  const { id } = data

  const locationData = data.location
  const activityData = {
    ...omit(data, ['location', 'id', 'userId']),
    location: omit(locationData, ['address', 'details', 'placeId']),
    status: 'active',
    createdAt: serverTimestamp(),
    userId,
  }

  const batch = db.batch()

  const activityRef = db.doc(`activities/${id}`)
  const locationRef = db.doc(`locations/${id}`)

  batch.set(activityRef, activityData)
  batch.set(locationRef, locationData)

  // TODO: try catch errors

  return batch.commit()
})
