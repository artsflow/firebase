import * as functions from 'firebase-functions'
import { format } from 'date-fns'

import { serverTimestamp, stripe, db } from '../../config'
import { getDocument } from '../../utils'
import { notifyUserCancelBooking } from '../../notifications'

export const cancelBooking = functions
  .region('europe-west2')
  .https.onCall(async ({ id }, context) => {
    const userId = context.auth?.uid

    if (!userId) return false

    const { data: booking, snapshot } = await getDocument(id, 'bookings')
    const { dateString, title, email, creativeId } = booking

    const { data: creative } = await getDocument(creativeId, 'users')

    functions.logger.info(booking)

    if (booking.userId !== userId) {
      functions.logger.error('booking does not mach user', userId, booking)
      return false
    }

    await snapshot.ref.update({
      isCancelled: true,
      cancelledAt: serverTimestamp(),
    })

    if (booking.stripePaymentIntendId) {
      await stripe.refunds.create(
        {
          payment_intent: booking.stripePaymentIntendId,
          refund_application_fee: true,
        },
        {
          stripeAccount: creative.stripeAccountId,
        }
      )
    }

    const taskRef = await db.collection('tasks').where('options.bookingId', '==', booking.id).get()
    taskRef.forEach((doc) => doc.ref.delete())

    const notifyUserData = {
      title,
      email,
      activityDate: format(new Date(dateString), 'dd MMM, yyy - HH:mm'),
    }

    notifyUserCancelBooking(notifyUserData)

    return true
  })
