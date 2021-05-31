import * as functions from 'firebase-functions'
import { ServerClient } from 'postmark'

import { POSTMARK_SERVER_TOKEN } from '../../config'

export const getServerStats = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    const client = new ServerClient(POSTMARK_SERVER_TOKEN)

    const calls: Promise<any>[] = [
      client.getBounceCounts(),
      client.getSpamComplaintsCounts(),
      client.getSentCounts(),
      client.getTrackedEmailCounts(),
      client.getEmailOpenCounts(),
      client.getClickCounts(),
      client.getSuppressions('newsletter'),
    ]

    const stats = await Promise.all(calls)

    return stats
  })
