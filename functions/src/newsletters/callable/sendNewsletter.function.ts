import * as functions from 'firebase-functions'
import { ServerClient, Models } from 'postmark'
import { uniqBy } from 'lodash'

import { db, serverTimestamp } from '../../config'
import { getPostmarkServerToken } from '../../utils'

export const sendNewsletter = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any
    const userName = context.auth?.token.name
    const userEmail = context.auth?.token.email

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    const { to, body, subject } = data

    functions.logger.info(to?.value)

    const newsletter = {
      From: `${userName}<${userId}@artsflow.com>`,
      ReplyTo: userEmail,
      To: userEmail,
      Subject: subject,
      HtmlBody: body,
      Tag: to?.value,
      MessageStream: 'newsletter',
      Metadata: { userId, to: to?.value },
      TrackOpens: true,
      TrackLinks: Models.LinkTrackingOptions.HtmlAndText,
    }

    const token = await getPostmarkServerToken(userId)
    const client = new ServerClient(token)

    if (to?.value === 'myself') {
      await client.sendEmail(newsletter)
      return { ok: true }
    }

    let list: any = []

    switch (to?.value) {
      case 'everybody':
        list = await getEverybody(userId)
        break
      case 'audience':
        list = await getAudience(userId)
        break
      case 'bookings':
        list = uniqBy(await getBookings(userId), 'email')
        break
      default:
        list = uniqBy(
          (await getBookings(userId)).filter((b: any) => b.activityId === to?.value),
          'email'
        )
    }

    const { id: newsletterId } = await db
      .collection('newsletters')
      .add({ ...data, userId, recipients: list.length, createdAt: serverTimestamp() })

    const batchList = list.map(({ email }: any) => ({
      ...newsletter,
      To: email,
      Tag: newsletterId,
      Metadata: { ...newsletter.Metadata, newsletterId },
    }))

    await client.sendEmailBatch(batchList)

    return { ok: true }
  })

const getBookings = async (userId: string) => {
  const ref = await db.collection('bookings').where('creativeId', '==', userId).get()
  return ref.docs
    .map((doc) => doc.data())
    .map(({ name, email, activityId }) => ({ name, email, activityId }))
}

const getAudience = async (userId: string) => {
  const ref = await db.collection('audience').where('userId', '==', userId).get()
  return ref.docs.map((doc) => doc.data()).map(({ name, email }) => ({ name, email }))
}

const getEverybody = async (userId: string) => {
  const bookings = await getBookings(userId)
  const audience = await getAudience(userId)
  return uniqBy([...bookings, ...audience], 'email')
}
