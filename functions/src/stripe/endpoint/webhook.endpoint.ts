import * as functions from 'firebase-functions'
import { format } from 'date-fns'

import { db, serverTimestamp, stripe, STRIPE_WEBHOOK_SECRET } from '../../config'
import { getDocument } from '../../utils'
import { notifyCreativeNewBooking, notifyUserNewBooking } from '../../notifications'

export const webhook = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
  })
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
      response.status(400).send(`Webhook Error: ${err.message}`)
    }
  })

const createBooking = async (data: any) => {
  const { userId, phone, creativeId, title, name, email, dateString } = data.metadata
  const { data: user, snapshot: userSnapshot } = await getDocument(userId, 'users')
  if (!user.phone) await userSnapshot.ref.set({ phone }, { merge: true })

  const bookingData = {
    ...data.metadata,
    timestamp: Number(data.metadata.timestamp),
    stripePaymentIntendId: data.id,
    createdAt: serverTimestamp(),
  }

  await db.collection('bookings').add(bookingData)

  const { data: creative } = await getDocument(creativeId, 'users')
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
}
