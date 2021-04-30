import * as functions from 'firebase-functions'

import { stripe, STRIPE_WEBHOOK_SECRET } from '../../config'

const webhookHandler = async (data: any) => {
  functions.logger.log('webhookHandler', data)
}

export const webhook = functions.https.onRequest(async (request, response) => {
  const sig = request.headers['stripe-signature'] as any
  const event = stripe.webhooks.constructEvent(request['rawBody'], sig, STRIPE_WEBHOOK_SECRET)
  functions.logger.log(event)
  try {
    await webhookHandler(event)
    response.send({ received: true })
  } catch (err) {
    functions.logger.error(err)
    response.status(400).send(`Webhook Error: ${err.message}`)
  }
})
