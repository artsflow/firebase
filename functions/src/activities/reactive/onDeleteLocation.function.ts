import * as functions from 'firebase-functions'

import { db } from '../../config'

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
