import * as functions from 'firebase-functions'

import { db } from './config'

export const createUserRecord = functions
  .region('europe-west2')
  .auth.user()
  .onCreate(async (user, context) => {
    const userRef = db.doc(`users/${user.uid}`)
    const profileRef = db.doc(`profiles/${user.uid}`)
    const batch = db.batch()

    const [firstName = null, lastName = null] = user.displayName?.split(' ') || ''

    if (!user?.email) return Promise.reject(new Error('not_auth'))

    const betaTesterRef = db.collection('betatesters').doc(user.email)
    const doc = await betaTesterRef.get()

    const isBetaTester = doc.exists ? true : false

    const userData = {
      createdAt: context.timestamp,
      email: user.email,
      displayName: user.displayName,
      firstName,
      lastName,
      emailVerified: user.emailVerified,
      provider: user.providerData[0].providerId,
      isBetaTester,
    }

    const profileData = {
      createdAt: context.timestamp,
      displayName: user.displayName,
      photoURL: user.photoURL,
      firstName,
      lastName,
    }

    batch.set(userRef, userData)
    batch.set(profileRef, profileData)

    return batch.commit()
  })
