import * as functions from 'firebase-functions'

import { db } from './config'

export const createUserRecord = functions
  .region('europe-west2')
  .auth.user()
  .onCreate((user, context) => {
    const userRef = db.doc(`users/${user.uid}`)
    const profileRef = db.doc(`profiles/${user.uid}`)
    const batch = db.batch()

    const userData = {
      createdAt: context.timestamp,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      provider: user.providerData[0].providerId,
    }

    const profileData = {
      createdAt: context.timestamp,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }

    batch.set(userRef, userData)
    batch.set(profileRef, profileData)

    return batch.commit()
  })
