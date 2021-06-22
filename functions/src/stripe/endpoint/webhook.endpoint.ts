import * as functions from 'firebase-functions'
import { format, subDays, subHours } from 'date-fns'

import { db, serverTimestamp, stripe, STRIPE_WEBHOOK_SECRET } from '../../config'
import { getDocument } from '../../utils'
import { notifyCreativeNewBooking, notifyUserNewBooking } from '../../notifications'
import { scheduleTask } from '../../system/workers'

export const webhook = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'] as any
    const event = stripe.webhooks.constructEvent(request['rawBody'], sig, STRIPE_WEBHOOK_SECRET)

    try {
      if (event.type === 'payment_intent.succeeded') {
        await createBooking(event.data.object)
      }

      response.send({ received: true })
    } catch (err) {
      functions.logger.error(err)
      response.status(400).send(`Webhook Error`)
    }
  })

const createBooking = async (data: any) => {
  const {
    userId,
    phone,
    creativeId,
    title,
    name,
    email,
    dateString,
    activityId,
    timestamp,
    amount,
    isFeePassed,
  } = data.metadata
  const { data: user, snapshot: userSnapshot } = await getDocument(userId, 'users')
  if (!user.phone) await userSnapshot.ref.set({ phone }, { merge: true })

  const { data: creative } = await getDocument(creativeId, 'users')
  const { data: activity } = await getDocument(activityId, 'activities')

  const bookingData = {
    ...data.metadata,
    timestamp: Number(timestamp),
    amount: Number(amount),
    isFeePassed: isFeePassed === 'true' ? true : false, // because Stripe metadata is saved as string not boolean
    stripePaymentIntendId: data.id,
    createdAt: serverTimestamp(),
  }

  const { id: bookingId } = await db.collection('bookings').add(bookingData)

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

  const notifyUserData = {
    bookingId,
    id: activity.id,
    image: activity.images[0],
    title,
    name,
    email,
    activityDate,
    creativeName,
    presenceUrl: activity.activityPresence === 'Online' ? activity.presenceUrl : '',
    price: activity.monetizationType === 'Free' ? 'Free to join' : `£${activity.price} paid`,
  }

  notifyUserNewBooking(notifyUserData)

  // TODO: add bookingId to options in order to not deliver when cancelled

  await scheduleTask({
    createdAt: serverTimestamp(),
    performAt: subHours(new Date(dateString), 1),
    worker: 'notifyUserScheduledBooking',
    options: { ...notifyUserData, startsIn: '1 hour' },
  })

  await scheduleTask({
    createdAt: serverTimestamp(),
    performAt: subDays(new Date(dateString), 1),
    worker: 'notifyUserScheduledBooking',
    options: { ...notifyUserData, startsIn: '1 day' },
  })
}
