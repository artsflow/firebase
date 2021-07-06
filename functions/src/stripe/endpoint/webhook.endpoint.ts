import * as functions from 'firebase-functions'

import { stripe, STRIPE_WEBHOOK_SECRET } from '../../config'

export const webhook = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'] as any
    const event = stripe.webhooks.constructEvent(request['rawBody'], sig, STRIPE_WEBHOOK_SECRET)

    try {
      if (event.type === 'payment_intent.succeeded') {
        // await createBooking(event.data.object)
      }

      response.send({ received: true })
    } catch (err) {
      functions.logger.error(err)
      response.status(400).send(`Webhook Error`)
    }
  })
