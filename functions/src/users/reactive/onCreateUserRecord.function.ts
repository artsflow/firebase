import * as functions from 'firebase-functions'

import { db, serverTimestamp, stripe } from '../../config'

export const onCreateUserRecord = functions
  .region('europe-west2')
  .auth.user()
  .onCreate(async (user) => {
    const userRef = db.doc(`users/${user.uid}`)
    const profileRef = db.doc(`profiles/${user.uid}`)
    const batch = db.batch()

    // TODO: check if it is creative (created with metadata from web app)
    const stripeAcc = await stripe.accounts.create({
      country: 'GB',
      type: 'custom',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      email: user.email,
      metadata: {
        userId: user.uid,
      },
    })

    const [firstName = null, lastName = null] = user.displayName?.split(' ') || ''

    if (!user?.email) return Promise.reject(new Error('not_auth'))

    const betaTesterRef = db.collection('betatesters').doc(user.email)
    const doc = await betaTesterRef.get()

    const isBetaTester = doc.exists ? true : false

    const userData = {
      createdAt: serverTimestamp(),
      email: user.email,
      displayName: user.displayName,
      firstName,
      lastName,
      emailVerified: user.emailVerified,
      provider: user.providerData[0].providerId,
      isBetaTester,
    }

    const profileData = {
      createdAt: serverTimestamp(),
      displayName: user.displayName,
      photoURL: user.photoURL,
      firstName,
      lastName,
      sid: stripeAcc.id,
    }

    batch.set(userRef, userData)
    batch.set(profileRef, profileData)

    return batch.commit()
  })
