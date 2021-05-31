import * as functions from 'firebase-functions'

import { db } from '../../config'

export const updateAvatarUrl = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid

    const { photoURL } = data

    if (!userId) return false

    const profileRef = db.collection('profiles').doc(userId)

    return profileRef.update({ photoURL })
  })
