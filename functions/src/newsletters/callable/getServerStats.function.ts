import * as functions from 'firebase-functions'
import { ServerClient } from 'postmark'

import { getPostmarkServerToken } from '../../utils'

export const getServerStats = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    const token = await getPostmarkServerToken(userId)
    const client = new ServerClient(token)

    const calls: Promise<any>[] = [
      client.getSpamComplaintsCounts(),
      client.getSentCounts(),
      client.getEmailOpenCounts(),
      client.getClickCounts(),
      client.getSuppressions('newsletter'),
      client.getBounceCounts(),
    ]

    const stats = await Promise.all(calls)

    const [spam, sent, open, clicks, suppressions, bounced] = stats

    return { spam, sent, open, clicks, suppressions, bounced }
  })
