import * as functions from 'firebase-functions'
import { omit } from 'lodash'

import { db, serverTimestamp } from './config'
import { nanoid } from './utils'

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

export const onDeleteActivity = functions
  .region('europe-west2')
  .firestore.document('activities/{id}')
  .onDelete(async (snap) => {
    const batch = db.batch()

    const deletedActivityData = snap.data()
    const deletedActivitiesRef = db.doc(`deleted_activities/${snap.id}`)

    batch.set(
      deletedActivitiesRef,
      {
        ...deletedActivityData,
        meta: { deletedAt: serverTimestamp() },
      },
      { merge: true }
    )

    return batch.commit()
  })

export const onDeleteLocation = functions
  .region('europe-west2')
  .firestore.document('locations/{id}')
  .onDelete(async (snap) => {
    const batch = db.batch()

    const deletedLocationData = snap.data()
    const deletedActivitiesRef = db.doc(`deleted_activities/${snap.id}`)

    batch.set(
      deletedActivitiesRef,
      {
        location: { ...deletedLocationData },
      },
      { merge: true }
    )

    return batch.commit()
  })

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
