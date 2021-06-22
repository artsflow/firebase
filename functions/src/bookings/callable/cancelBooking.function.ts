import * as functions from 'firebase-functions'

import { serverTimestamp, stripe } from '../../config'
import { getDocument } from '../../utils'

export const cancelBooking = functions
  .region('europe-west2')
  .https.onCall(async ({ id }, context) => {
    const userId = context.auth?.uid

    if (!userId) return false

    const { data: booking, snapshot } = await getDocument(id, 'bookings')

    functions.logger.info(booking)

    if (booking.userId !== userId) {
      functions.logger.error('booking does not mach user', userId, booking)
      return false
    }

    await snapshot.ref.update({
      isCancelled: true,
      cancelledAt: serverTimestamp(),
      amount: -booking.amount,
    })

    if (booking.stripePaymentIntendId) {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntendId,
        refund_application_fee: true,
        reverse_transfer: true,
      })
    }

    // TODO: remove notifications
    // TODO: notify user of cancelling event

    return true
  })
