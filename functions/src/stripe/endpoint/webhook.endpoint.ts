import * as functions from 'firebase-functions'

import { db, serverTimestamp, stripe, STRIPE_WEBHOOK_SECRET } from '../../config'

export const webhook = functions
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'] as any
    const event = stripe.webhooks.constructEvent(request['rawBody'], sig, STRIPE_WEBHOOK_SECRET)

    try {
      if (event.type === 'payment_intent.succeeded') {
        await createAttendee(event.data.object)
      }

      response.send({ received: true })
    } catch (err) {
      functions.logger.error(err)
      response.status(400).send(`Webhook Error: ${err.message}`)
    }
  })

const createAttendee = async (data: any) => {
  const attendeeData = {
    ...data.metadata,
    stripePaymentIntendId: data.id,
    createdAt: serverTimestamp(),
  }

  await db.collection('attendeees').add(attendeeData)
  // TODO: send email to user (attendee) and creative
}
