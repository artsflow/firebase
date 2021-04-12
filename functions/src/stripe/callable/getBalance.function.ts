import * as functions from 'firebase-functions'

import { stripe } from '../../config'
import { getStripeAccount } from '../utils'

export const getBalance = functions.region('europe-west2').https.onCall(async (data, context) => {
  console.log('getBalance!!')
  const userId = context.auth?.uid

  if (!userId) return false

  const stripeAcc = await getStripeAccount(userId)

  if (!stripeAcc) return null

  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAcc.id })
    console.log('balance', balance)
    return balance
  } catch (error) {
    console.error('ERROR:getPayoutsData:', error)
    return error
  }
})
