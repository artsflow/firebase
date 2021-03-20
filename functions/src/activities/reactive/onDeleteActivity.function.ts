import * as functions from 'firebase-functions'

import { db, serverTimestamp } from '../../config'

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
