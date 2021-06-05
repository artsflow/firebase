import * as functions from 'firebase-functions'
import { fromUnixTime, format, subDays, subHours } from 'date-fns'

import { getDocument } from '../../utils'
import { db, serverTimestamp } from '../../config'
import { notifyCreativeNewBooking, notifyUserNewBooking } from '../../notifications'
import { scheduleTask } from '../../system/workers'

export const createFreeBooking = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    const { activityId, timestamp, phone, name, title } = data

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

    const activityDate = format(new Date(dateString), 'dd MMM, yyy - HH:mm')

    const notifyCreativeData = {
      title,
      name: creative.firstName,
      email: creative.email,
      activityDate,
      userName: name,
      userEmail: email,
    }

    const creativeName = `${creative.displayName}`
    notifyCreativeNewBooking(notifyCreativeData)
    notifyUserNewBooking({ title, name, email, activityDate, creativeName })

    // TODO: add bookingId to options in order to not deliver when cancelled

    await scheduleTask({
      performAt: subHours(new Date(dateString), 1),
      worker: 'notifyUserScheduledBooking',
      options: { title, name, email, activityDate, creativeName, startsIn: '1 hour' },
    })

    await scheduleTask({
      performAt: subDays(new Date(dateString), 1),
      worker: 'notifyUserScheduledBooking',
      options: { title, name, email, activityDate, creativeName, startsIn: '1 day' },
    })

    return true
  })
