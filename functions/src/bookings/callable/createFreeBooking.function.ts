import * as functions from 'firebase-functions'
import { fromUnixTime } from 'date-fns'

import { getDocument } from '../../utils'
import { db, serverTimestamp } from '../../config'

export const createFreeBooking = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    const { activityId, timestamp, phone, name } = data

    if (!userId || !activityId || !timestamp) return false

    const { data: user, snapshot: userSnapshot } = await getDocument(userId, 'users')
    const { data: activity } = await getDocument(activityId, 'activities')
    const { data: creative } = await getDocument(activity.userId, 'users')

    const dateString = fromUnixTime(timestamp).toString()

    const email = user.email
    const activityTitle = activity.title
    const amount = 0

    const bookingData = {
      isFree: true,
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
      createdAt: serverTimestamp(),
    }

    if (!user.phone) await userSnapshot.ref.set({ phone }, { merge: true })

    await db.collection('bookings').add(bookingData)
    // TODO: send email to user  and creative

    return true
  })
