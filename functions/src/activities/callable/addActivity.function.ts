import * as functions from 'firebase-functions'
import { omit } from 'lodash'

import { db, serverTimestamp } from '../../config'
import { nanoid, getDocument } from '../../utils'
import { notifyAddActivity } from '../../notifications'
import { trackCreateActivity } from '../../analytics'

export const addActivity = functions.region('europe-west2').https.onCall(async (data, context) => {
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

  trackCreateActivity({ userId, ...data })

  const { data: userData } = await getDocument(userId, 'users')
  const { email, firstName, displayName } = userData

  notifyAddActivity({ id, title: data.title, email, name: firstName || displayName })

  return id
})
