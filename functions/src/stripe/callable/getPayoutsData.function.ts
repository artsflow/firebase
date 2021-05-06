import * as functions from 'firebase-functions'

import { stripe } from '../../config'
import { getStripeAccount } from '../../utils'

export const getPayoutsData = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('getPayoutsData!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAccount = await getStripeAccount(userId)
    if (!stripeAccount) return null
    console.log('stripeAccount', stripeAccount.id)

    try {
      const bankAccounts = await stripe.accounts.listExternalAccounts(stripeAccount.id)
      const list = await stripe.payouts.list({ limit: 100 }, { stripeAccount: stripeAccount.id })

      return {
        accounts: bankAccounts.data,
        list,
      }
    } catch (error) {
      console.error('ERROR:getPayoutsData:', error)
      return error
    }
  })
