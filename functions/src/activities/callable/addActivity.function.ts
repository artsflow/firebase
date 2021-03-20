import * as functions from 'firebase-functions'
import { omit } from 'lodash'

import { db, serverTimestamp } from '../../config'
import { nanoid } from '../../utils'

export const addActivity = functions.region('europe-west2').https.onCall(async (data, context) => {
  console.log('addActivity!!', data)
  const userId = context.auth?.uid

  if (!userId) return false

  const id = nanoid()

  // TODO: should check activity data integrity

  const locationData = data.location
  const activityData = {
    ...omit(data, 'location'),
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
  await batch.commit()

  return id
})
