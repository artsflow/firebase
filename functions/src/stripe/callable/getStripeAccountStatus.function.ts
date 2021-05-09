import * as functions from 'firebase-functions'

import { getStripeAccount } from '../../utils'

export const getStripeAccountStatus = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
  })
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid

    if (!userId) return false

    const stripeAccount = (await getStripeAccount(userId)) as any

    if (!stripeAccount) return null

    const verified =
      stripeAccount?.capabilities?.card_payments === 'active' &&
      stripeAccount?.capabilities?.transfers === 'active' &&
      stripeAccount?.requirements?.pending_verification?.length === 0 &&
      stripeAccount?.requirements?.errors?.length === 0

    const moreInfoNeeded =
      stripeAccount?.requirements?.pending_verification?.length > 0 ||
      stripeAccount?.requirements?.errors?.length > 0

    return {
      verified,
      payouts_enabled: stripeAccount.payouts_enabled,
      requirements: stripeAccount.requirements,
      moreInfoNeeded,
    }
  })
