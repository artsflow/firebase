import * as functions from 'firebase-functions'

import { stripe } from '../../config'
import { getStripeAccount } from '../../utils'

export const addStripeExternalAccount = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    console.log('addStripeExternalAccount!!', data)
    const userId = context.auth?.uid
    const { account } = data

    if (!userId) return false

    const stripeAcc = await getStripeAccount(userId)

    if (!stripeAcc) return null

    try {
      const bankAccount = await stripe.accounts.createExternalAccount(stripeAcc.id, {
        // @ts-ignorecreateExternalAccount
        external_account: {
          currency: 'gbp',
          country: 'GB',
          object: 'bank_account',
          routing_number: account.sortcode,
          account_number: account.account,
        },
        metadata: {
          userId,
        },
      })
      console.log(bankAccount)
      return bankAccount
    } catch (error) {
      console.error('ERROR:createExternalAccount:', error)
      return error
    }
  })
