import * as functions from 'firebase-functions'
import { ServerClient } from 'postmark'

// import { getDocument } from '../../utils'
// import { db, serverTimestamp } from '../../config'
import { POSTMARK_SERVER_TOKEN } from '../../config'

const client = new ServerClient(POSTMARK_SERVER_TOKEN)

export const sendNewsletter = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any
    const userName = 'Jane Smith'
    const userEmail = 'radu@artsflow.com'

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    // const m = await client.getOutboundMessageDetails('42474ca9-0acf-4b43-8b51-0d5274d50297')

    return

    functions.logger.info(context.auth, data)
    const { body, subject } = data

    // save newsletters to firestore
    const newsletterId = 'zxc'

    const newsletter = {
      From: `${userName}<${userId}@artsflow.com>`,
      ReplyTo: userEmail,
      To: 'hello@42tech.co',
      Subject: subject,
      HtmlBody: body,
      MessageStream: 'newsletter',
      Metadata: { userId, newsletterId },
    }
    const res = await client.sendEmail(newsletter)
    functions.logger.info(res)

    return true
  })
