import * as functions from 'firebase-functions'

import { db, stripe, STRIPE_WEBHOOK_SECRET_CONNECT } from '../../config'
import { trackUpdatePerson } from '../../analytics'

export const webhookConnect = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'] as any
    const event = stripe.webhooks.constructEvent(
      request['rawBody'],
      sig,
      STRIPE_WEBHOOK_SECRET_CONNECT
    )

    try {
      if (event.type === 'account.updated') {
        await updateAccount(event.data.object)
      }
      if (event.type === 'person.updated') {
        await updatePerson(event.data.object)
      }
      if (event.type === 'balance.available') {
        // await updateBalance(event)
      }

      response.send({ received: true })
    } catch (err) {
      functions.logger.error(err)
      response.status(400).send(`Webhook Error: ${err.message}`)
    }
  })

const updateAccount = async (data: any) => {
  if (data.charges_enabled) functions.logger.info(data)
}

const updatePerson = async (data: any) => {
  if (data.verification.status === 'verified' && data.relationship.representative) {
    const {
      first_name: firstName,
      last_name: lastName,
      phone,
      address,
      dob,
      id: stripePersonId,
      account: stripeAccountId,
    } = data
    const displayName = `${firstName} ${lastName}`

    const userData = {
      firstName,
      lastName,
      displayName,
      phone,
      address,
      dob,
      stripePersonId,
    }
    const profileData = {
      firstName,
      lastName,
      displayName,
    }

    const snapshot = await db
      .collection('users')
      .where('stripeAccountId', '==', stripeAccountId)
      .get()

    const userId = snapshot.docs[0].id

    const batch = db.batch()

    const userRef = db.collection('users').doc(userId)
    const profileRef = db.collection('profiles').doc(userId)

    batch.update(userRef, userData)
    batch.update(profileRef, profileData)

    batch.commit()

    trackUpdatePerson({ userId, ...userData })
    // functions.logger.info(data)
  }
}

// const updateBalance = async (data: any) => {
//   functions.logger.info(data)
// }
