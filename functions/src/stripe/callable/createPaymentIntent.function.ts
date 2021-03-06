import * as functions from 'firebase-functions'
import { fromUnixTime } from 'date-fns'

import { stripe, ARTSFLOW_FEE } from '../../config'
import { getOrCreateStripeCustomer, getDocument } from '../../utils'

export const createPaymentIntent = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    const { activityId, timestamp, phone, name } = data

    if (!userId || !activityId || !timestamp) return false

    const { data: user } = await getDocument(userId, 'users')
    const { data: activity } = await getDocument(activityId, 'activities')
    const { data: creative } = await getDocument(activity.userId, 'users')

    const dateString = fromUnixTime(timestamp).toString()

    const email = user.email
    const activityTitle = activity.title
    const isFeePassed = activity.isFeePassed
    const price = activity.price * 100
    const artsflowFeeAmount = Math.round((price * ARTSFLOW_FEE) / 100)
    const creativeConnectedAccountId = creative.stripeAccountId
    const amount = isFeePassed ? price + artsflowFeeAmount : price

    const customer = await getOrCreateStripeCustomer(userId, creative, { phone, name })

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'gbp',
        payment_method_types: ['card'],
        application_fee_amount: artsflowFeeAmount,
        receipt_email: email,
        description: activityTitle,
        customer: customer.id,
        statement_descriptor_suffix: 'artsflow',
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
          isFeePassed,
        },
      },
      {
        stripeAccount: creativeConnectedAccountId,
      }
    )

    return {
      clientSecret: paymentIntent.client_secret,
    }
  })
