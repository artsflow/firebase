import * as functions from 'firebase-functions'
import { fromUnixTime } from 'date-fns'

import { stripe, ARTSFLOW_FEE } from '../../config'
import { getOrCreateStripeCustomer, getDocument } from '../../utils'

export const getPaymentIntent = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
  })
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    const { activityId, timestamp, phone, name } = data

    if (!userId || !activityId || !timestamp) return false

    const { data: user } = await getDocument(userId, 'users')
    const { data: activity } = await getDocument(activityId, 'activities')
    const { data: creative } = await getDocument(activity.userId, 'users')

    const dateString = fromUnixTime(timestamp).toString()

    const email = user.email
    const activityTitle = activity.title
    const amount = activity.price * 100

    const artsflowFeeAmount = Math.round((amount * ARTSFLOW_FEE) / 100)
    const creativeConnectedAccountId = creative.stripeAccountId

    const customer = await getOrCreateStripeCustomer(userId, { phone, name })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      payment_method_types: ['card'],
      application_fee_amount: artsflowFeeAmount,
      receipt_email: email,
      description: activityTitle,
      customer: customer.id,
      on_behalf_of: creativeConnectedAccountId,
      statement_descriptor_suffix: 'artsflow',
      transfer_data: {
        destination: creativeConnectedAccountId,
      },
      metadata: {
        userId,
        name,
        phone,
        email,
        activityId,
        timestamp: Number(timestamp),
        dateString,
        title: activityTitle,
        creativeId: creative.id,
        amount,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret,
    }
  })
