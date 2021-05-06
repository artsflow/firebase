import * as functions from 'firebase-functions'

import { stripe } from '../../config'
import { getStripeAccount } from '../../utils'

export const getPayoutsData = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('getPayoutsData!!')
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAcc = await getStripeAccount(userId)

    if (!stripeAcc) return null

    try {
      const bankAccounts = await stripe.accounts.listExternalAccounts(stripeAcc.id, {
        limit: 3,
      })

      return {
        accounts: bankAccounts.data,
        list: [],
      }
    } catch (error) {
      console.error('ERROR:getPayoutsData:', error)
      return error
    }
  })
