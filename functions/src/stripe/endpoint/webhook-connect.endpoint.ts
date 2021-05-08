import * as functions from 'firebase-functions'

import { stripe, STRIPE_WEBHOOK_SECRET_CONNECT } from '../../config'

export const webhookConnect = functions
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
      if (event.type === 'balance.available') {
        await updateBalance(event.data.object)
      }

      response.send({ received: true })
    } catch (err) {
      functions.logger.error(err)
      response.status(400).send(`Webhook Error: ${err.message}`)
    }
  })

const updateAccount = async (data: any) => {
  functions.logger.info('CONNECT', data)
}

const updateBalance = async (data: any) => {
  functions.logger.info('CONNECT', data)
}
