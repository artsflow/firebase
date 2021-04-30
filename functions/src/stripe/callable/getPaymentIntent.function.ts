import * as functions from 'firebase-functions'

import { stripe, ARTSFLOW_FEE } from '../../config'
import { getOrCreateStripeCustomer } from '../utils'

export const getPaymentIntent = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('getPaymentIntent!!', data)
    const userId = context.auth?.uid as any

    const { activityId, date, time, phone, name } = data

    if (!userId) return false

    // get creative user - id
    // get creative activity - price / title /

    const email = 'ciocan@gmail.com'
    const activityTitle = 'Workshop'
    const amount = 2500

    const artsflowFeeAmount = (amount * ARTSFLOW_FEE) / 100
    const creativeConnectedAccount = 'acct_1IfQl4PfliBGToKi'

    const customer = await getOrCreateStripeCustomer(userId, { phone, name })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      payment_method_types: ['card'],
      application_fee_amount: artsflowFeeAmount,
      receipt_email: email,
      description: activityTitle,
      customer: customer.id,
      on_behalf_of: creativeConnectedAccount,
      transfer_data: {
        destination: creativeConnectedAccount,
      },
      metadata: { activityId, date, time, title: activityTitle },
    })

    return {
      clientSecret: paymentIntent.client_secret,
    }
  })
