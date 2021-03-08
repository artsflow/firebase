import * as functions from 'firebase-functions'

import { db } from './config'

export const updateProfile = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('updateProfile!!', data)
    const userId = context.auth?.uid
    const batch = db.batch()

    if (!userId) return false

    const userRef = db.collection('users').doc(userId)
    const profileRef = db.collection('profiles').doc(userId)

    batch.update(userRef, data)
    batch.update(profileRef, data)

    return batch.commit()
  })
