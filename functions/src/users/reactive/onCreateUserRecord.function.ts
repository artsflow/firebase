import * as functions from 'firebase-functions'

import { db, serverTimestamp } from '../../config'

export const onCreateUserRecord = functions
  .region('europe-west2')
  .auth.user()
  .onCreate(async (user) => {
    const userRef = db.doc(`users/${user.uid}`)
    const profileRef = db.doc(`profiles/${user.uid}`)
    const batch = db.batch()

    const [firstName = null, lastName = null] = user.displayName?.split(' ') || ''

    if (!user?.email) return Promise.reject(new Error('not_auth'))

    const userData = {
      createdAt: serverTimestamp(),
      email: user.email,
      displayName: user.displayName,
      firstName,
      lastName,
      emailVerified: user.emailVerified,
      provider: user.providerData[0].providerId,
    }

    const profileData = {
      createdAt: serverTimestamp(),
      displayName: user.displayName,
      photoURL: user.photoURL,
      firstName,
      lastName,
    }

    batch.set(userRef, userData)
    batch.set(profileRef, profileData)

    return batch.commit()
  })
