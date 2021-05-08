import * as functions from 'firebase-functions'

import { db } from '../../config'

export const updateProfile = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid
    const batch = db.batch()

    if (!userId) return false

    const userRef = db.collection('users').doc(userId)
    const profileRef = db.collection('profiles').doc(userId)

    const { firstName, lastName, address, bio } = data
    const displayName = `${firstName} ${lastName}`

    batch.update(userRef, { firstName, lastName, address, displayName })
    batch.update(profileRef, { firstName, lastName, bio, displayName })

    return batch.commit()
  })
